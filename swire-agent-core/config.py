import os
import yaml
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self):
        with open('config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)
    
    @property
    def aws_region(self):
        return os.getenv('AWS_REGION', self.config['aws']['region'])
    
    @property
    def bedrock_model_id(self):
        return os.getenv('BEDROCK_MODEL_ID', self.config['aws']['bedrock_model_id'])
    
    @property
    def database_url(self):
        return os.getenv('DATABASE_URL', 
                        f"postgresql://{self.config['database']['host']}:{self.config['database']['port']}/{self.config['database']['database']}")

config = Config()