import datetime
from flask import Flask, request, jsonify
from google.cloud import storage
from config import Config
from supabase import create_client, Client
import paho.mqtt.client as mqtt

app = Flask(__name__)
app.config.from_object(Config)

# Konfigurasi Google Cloud Storage
storage_client = storage.Client()
BUCKET_NAME = Config.BUCKET_NAME

# Konfigurasi Supabase
supabase_client: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Konfigurasi MQTT
mqtt_client = mqtt.Client()
# mqtt_client.username_pw_set(Config.MQTT_USERNAME, Config.MQTT_PASSWORD)
mqtt_client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)

def send_firmware_notification(device_type, version, url):
    """Kirim notifikasi firmware baru melalui MQTT"""
    topic = f"firmware/update/esp32"
    payload = {
        "device_type": device_type,
        "version": version,
        "url": url,
        "timestamp": datetime.datetime.now().isoformat()
    }
    mqtt_client.publish(topic, str(payload))

def upload_to_gcs(file, destination_blob_name):
    """Upload file langsung ke Google Cloud Storage dari request."""
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_file(file)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{destination_blob_name}"

@app.route('/upload', methods=['POST'])
def upload_firmware():
    """Unggah firmware baru langsung ke Google Cloud Storage."""
    if 'file' not in request.files:
        return jsonify({"error": "Tidak ada file yang diunggah"}), 400

    file = request.files['file']
    version = request.form.get('version')
    device_type = request.form.get('device_type', 'esp32')

    if not version:
        return jsonify({"error": "Version diperlukan"}), 400

    filename = f"{device_type}_v{version}"
    gcs_url = upload_to_gcs(file, filename)

    # Simpan metadata firmware ke Supabase
    data = {
        "filename": filename,
        "version": version,
        "device_type": device_type,
        "upload_date": datetime.datetime.now().isoformat()
    }
    
    response = supabase_client.table("firmware").insert(data).execute()

    # Kirim notifikasi firmware baru melalui MQTT
    send_firmware_notification(device_type, version, gcs_url)

    return jsonify({"message": "Firmware berhasil diunggah", "url": gcs_url})

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
