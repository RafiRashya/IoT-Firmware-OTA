from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    BUCKET_NAME = os.getenv('BUCKET_NAME')
    
    # Konfigurasi Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # Konfigurasi MQTT
    MQTT_BROKER = os.getenv('MQTT_BROKER')  # Contoh: "broker.hivemq.com"
    MQTT_PORT = int(os.getenv('MQTT_PORT'))
    MQTT_USERNAME = os.getenv('MQTT_USERNAME')
    MQTT_PASSWORD = os.getenv('MQTT_PASSWORD')
