import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage
from config import Config
from supabase import create_client, Client
import paho.mqtt.client as mqtt
import threading
import time
import gzip
import io

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

# Konfigurasi Google Cloud Storage
storage_client = storage.Client()
BUCKET_NAME = Config.BUCKET_NAME

# Konfigurasi Supabase
supabase_client: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Konfigurasi MQTT
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(Config.MQTT_USERNAME, Config.MQTT_PASSWORD)

def on_connect(client, userdata, flags, rc):
    print("Terhubung ke broker MQTT dengan kode:", rc)

def on_disconnect(client, userdata, rc):
    print("Terputus dari broker MQTT dengan kode:", rc)
    time.sleep(5)
    try:
        client.reconnect()
    except Exception as e:
        print("Gagal reconnect:", e)

mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect

def mqtt_loop():
    while True:
        try:
            mqtt_client.loop()
        except Exception as e:
            print("Error dalam MQTT loop:", e)
        time.sleep(1)

# Mulai thread MQTT
mqtt_thread = threading.Thread(target=mqtt_loop)
mqtt_thread.daemon = True
mqtt_thread.start()

# Koneksi MQTT
try:
    mqtt_client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
except Exception as e:
    print("Gagal koneksi ke broker MQTT:", e)

def send_firmware_notification(device_type, node_type, version, url):
    """Kirim notifikasi firmware baru melalui MQTT"""
    try:
        if not mqtt_client.is_connected():
            print("Mencoba reconnect MQTT...")
            mqtt_client.reconnect()
        
        topic = f"firmware/update/{device_type}/{node_type}"
        payload = {
            "url": url,
            "timestamp": datetime.datetime.now().isoformat()
        }

        result = mqtt_client.publish(topic, str(payload))

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("Notifikasi berhasil dikirim ke topic:", topic)
        else:
            print("Gagal mengirim notifikasi. Kode error:", result.rc)
    except Exception as e:
        print("Error saat mengirim notifikasi:", e)

def upload_to_gcs(file, destination_blob_name, node_id):
    """Upload file ke GCS dan generate signed URL."""
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"node-{node_id}/{destination_blob_name}")
    blob.upload_from_file(file)

    signed_url = blob.generate_signed_url(
        expiration=datetime.timedelta(minutes=15),
        version="v4",
        method="GET"
    )
    return signed_url

def get_last_version(node_type):
    """Mendapatkan versi terakhir dari firmware history."""
    try:
        response = supabase_client.table("firmware_history")\
            .select("version_to")\
            .eq("node_type", node_type)\
            .order("update_date", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data:
            return response.data[0]["version_to"]
        return ""
    except Exception as e:
        print("Error saat mengambil versi terakhir:", e)
        return ""

@app.route('/upload', methods=['POST'])
def upload_firmware():
    """Unggah firmware baru langsung ke Google Cloud Storage."""
    if 'file' not in request.files:
        return jsonify({"error": "Tidak ada file yang diunggah"}), 400

    file = request.files["file"]
    version = request.form.get("version")
    device_type = request.form.get("device_type", "esp32")
    node = request.form.get("node_type")
    description = request.form.get("description", "")
    status = "Berhasil"

    if not version:
        return jsonify({"error": "Version diperlukan"}), 400

    # Kompresi file dengan gzip
    compressed_buffer = io.BytesIO()
    with gzip.GzipFile(fileobj=compressed_buffer, mode='wb', compresslevel=9) as gz:
        gz.write(file.read())
    compressed_buffer.seek(0)  # Kembali ke awal buffer untuk dibaca saat upload

    filename = f"{node}_v{version}.gz"
    gcs_url = upload_to_gcs(compressed_buffer, filename, node)

    # Simpan metadata firmware ke Supabase
    data = {
        "filename": filename,
        "version": version,
        "device_type": device_type,
        "node_type": node,
        "description": description,
        "url": gcs_url,
        "upload_date": datetime.datetime.now().isoformat(),
    }
    
    try:
        supabase_client.table("firmware").insert(data).execute()
        send_firmware_notification(device_type, node, version, gcs_url)
    except Exception as e:
        status = "Gagal"
        # Anda bisa menambahkan log error di sini

    # Dapatkan versi terakhir dari history
    # version_from = get_last_version(node)

    # Simpan riwayat ke tabel firmware_history
    history_data = {
        "node_type": node,
        "device_type": device_type,
        "version_from": get_last_version(node),
        "version_to": version,
        "status": status,
        "description": description,
        "update_date": datetime.datetime.now().isoformat()
    }
    supabase_client.table("firmware_history").insert(history_data).execute()

    if status == "Berhasil":
        return jsonify({"message": "Firmware berhasil diunggah", "url": gcs_url})
    else:
        return jsonify({"error": "Gagal mengunggah firmware"}), 500

@app.route('/latest', methods=['GET'])
def get_latest_firmware():
    """Cek firmware terbaru untuk perangkat tertentu dari Supabase."""
    device_type = request.args.get('device_type', 'esp32')
    response = supabase_client.table("firmware").select("filename, version").eq("device_type", device_type).order("upload_date", desc=True).limit(1).execute()
    
    if response.data:
        firmware = response.data[0]
        filename, version = firmware["filename"], firmware["version"]
        gcs_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"
        return jsonify({"version": version, "url": gcs_url})

    return jsonify({"error": "Firmware tidak ditemukan"}), 404

@app.route('/history', methods=['GET'])
def get_firmware_history():
    node_type = request.args.get('node_type')
    query = supabase_client.table("firmware_history").select("*")
    if node_type:
        query = query.eq("node_type", node_type)
    response = query.order("date", desc=True).limit(20).execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)