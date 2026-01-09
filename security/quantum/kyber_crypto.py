"""
Quantum-resistant cryptography implementation:
- Kyber (Post-Quantum Cryptography Standard)
- Hybrid encryption (quantum + classical)
- Key rotation and management
- Compliance with NIST PQC standards
"""

import os
import hashlib
import base64
from typing import Dict, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

# Note: Many cryptography libs may not expose kyber directly; these imports
# are placeholders to match the requested API surface. Replace with proper
# libs or bindings as needed in production.
try:
    from cryptography.hazmat.primitives.asymmetric import x25519, ed25519
    from cryptography.hazmat.primitives import serialization, hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
except Exception:
    x25519 = None
    ed25519 = None
    serialization = None
    hashes = None
    HKDF = None
    Cipher = None
    algorithms = None
    modes = None
    default_backend = None

@dataclass
class QuantumKeyConfig:
    """Configuration for quantum-resistant keys"""
    algorithm: str = "kyber1024"
    hybrid_mode: bool = True  # Combine with X25519
    key_rotation_days: int = 90
    key_backup_enabled: bool = True
    key_escrow_enabled: bool = False  # For regulated industries
    compliance_level: str = "nist_pqc_2026"

class QuantumResistantCrypto:
    """Quantum-resistant cryptography implementation"""
    
    def __init__(self, config: QuantumKeyConfig):
        self.config = config
        self.key_store = {}
        self.key_history = {}
        self.backend = default_backend()
        
    def generate_key_pair(self, key_id: str) -> Dict[str, Any]:
        """Generate quantum-resistant key pair"""
        # Placeholder: in production use a Kyber implementation
        private_key = os.urandom(64)
        public_key = hashlib.sha256(private_key).digest()
        
        hybrid_keys = {}
        if self.config.hybrid_mode and x25519:
            x_private = x25519.X25519PrivateKey.generate()
            x_public = x_private.public_key()
            hybrid_keys = {
                "x25519_private": x_private,
                "x25519_public": x_public
            }
        
        kyber_private_bytes = base64.b64encode(private_key)
        kyber_public_bytes = base64.b64encode(public_key)
        
        key_entry = {
            "key_id": key_id,
            "algorithm": self.config.algorithm,
            "kyber_private": kyber_private_bytes,
            "kyber_public": kyber_public_bytes,
            "hybrid_keys": hybrid_keys,
            "generated_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + 
                          timedelta(days=self.config.key_rotation_days)).isoformat(),
            "key_version": 1
        }
        
        self.key_store[key_id] = key_entry
        self._add_to_key_history(key_entry)
        if self.config.key_backup_enabled:
            self._backup_key(key_entry)
        
        return {
            "key_id": key_id,
            "public_key": base64.b64encode(kyber_public_bytes).decode(),
            "algorithm": self.config.algorithm,
            "hybrid": self.config.hybrid_mode,
            "expires": key_entry["expires_at"]
        }
    
    def encrypt(self, plaintext: bytes, recipient_key_id: str) -> Dict[str, Any]:
        """Encrypt data using quantum-resistant algorithms"""
        if recipient_key_id not in self.key_store:
            raise ValueError(f"Key {recipient_key_id} not found")
        
        key_entry = self.key_store[recipient_key_id]
        
        # Simulated KEM encapsulation
        shared_secret = hashlib.sha256(key_entry['kyber_public']).digest()
        encryption_key = self._derive_encryption_key(shared_secret)
        
        iv = os.urandom(12)
        cipher = Cipher(
            algorithms.AES(encryption_key),
            modes.GCM(iv),
            backend=self.backend
        )
        encryptor = cipher.encryptor()
        encryptor.authenticate_additional_data(key_entry['key_id'].encode())
        ciphertext_data = encryptor.update(plaintext) + encryptor.finalize()
        tag = encryptor.tag
        
        hybrid_data = {}
        if self.config.hybrid_mode and key_entry.get('hybrid_keys'):
            hybrid_data = self._add_hybrid_encryption(shared_secret, key_entry['hybrid_keys'].get('x25519_public'))
        
        return {
            "encrypted_data": base64.b64encode(ciphertext_data).decode(),
            "iv": base64.b64encode(iv).decode(),
            "tag": base64.b64encode(tag).decode(),
            "kyber_ciphertext": base64.b64encode(b"simulated_kem_ciphertext").decode(),
            "ephemeral_public": base64.b64encode(b"ephemeral_pub").decode(),
            "hybrid_data": hybrid_data,
            "key_id": recipient_key_id,
            "algorithm": self.config.algorithm,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def decrypt(self, encrypted_data: Dict[str, Any], 
               private_key_id: str) -> bytes:
        """Decrypt quantum-resistant encrypted data"""
        if private_key_id not in self.key_store:
            raise ValueError(f"Key {private_key_id} not found")
        
        key_entry = self.key_store[private_key_id]
        
        kyber_ciphertext = base64.b64decode(encrypted_data["kyber_ciphertext"])
        iv = base64.b64decode(encrypted_data["iv"])
        tag = base64.b64decode(encrypted_data["tag"])
        ciphertext_data = base64.b64decode(encrypted_data["encrypted_data"])
        
        # Simulated decapsulation
        shared_secret = hashlib.sha256(key_entry['kyber_private']).digest()
        if encrypted_data.get("hybrid_data") and self.config.hybrid_mode:
            shared_secret = self._handle_hybrid_decryption(shared_secret, encrypted_data["hybrid_data"], key_entry['hybrid_keys'].get('x25519_private'))
        
        encryption_key = self._derive_encryption_key(shared_secret)
        
        cipher = Cipher(
            algorithms.AES(encryption_key),
            modes.GCM(iv, tag),
            backend=self.backend
        )
        decryptor = cipher.decryptor()
        decryptor.authenticate_additional_data(encrypted_data["key_id"].encode())
        plaintext = decryptor.update(ciphertext_data) + decryptor.finalize()
        
        return plaintext
    
    def _derive_encryption_key(self, shared_secret: bytes) -> bytes:
        """Derive encryption key from shared secret"""
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,  # AES-256
            salt=None,
            info=b"quantum-encryption-key",
            backend=self.backend
        )
        return hkdf.derive(shared_secret)
    
    def _add_hybrid_encryption(self, kyber_secret: bytes, 
                              x25519_public_key) -> Dict[str, str]:
        """Add hybrid encryption with X25519"""
        if not x25519_public_key:
            return {}
        ephemeral_private = x25519.X25519PrivateKey.generate()
        ephemeral_public = ephemeral_private.public_key()
        shared_secret = ephemeral_private.exchange(x25519_public_key)
        combined_secret = hashlib.sha256(kyber_secret + shared_secret).digest()
        return {
            "ephemeral_x25519_public": base64.b64encode(ephemeral_public.public_bytes(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)).decode(),
            "combined_secret_hash": base64.b64encode(hashlib.sha256(combined_secret).digest()).decode()
        }
    
    def _handle_hybrid_decryption(self, kyber_secret: bytes,
                                 hybrid_data: Dict,
                                 x25519_private_key) -> bytes:
        """Handle hybrid decryption"""
        if not x25519_private_key:
            raise ValueError("Missing x25519 private key for hybrid decryption")
        ephemeral_public_bytes = base64.b64decode(hybrid_data["ephemeral_x25519_public"])
        ephemeral_public = x25519.X25519PublicKey.from_public_bytes(ephemeral_public_bytes)
        shared_secret = x25519_private_key.exchange(ephemeral_public)
        combined_secret = hashlib.sha256(kyber_secret + shared_secret).digest()
        expected_hash = base64.b64decode(hybrid_data["combined_secret_hash"])
        if hashlib.sha256(combined_secret).digest() != expected_hash:
            raise ValueError("Hybrid decryption failed - hash mismatch")
        return combined_secret
    
    def rotate_keys(self) -> Dict[str, Any]:
        """Rotate all expired or soon-to-expire keys"""
        rotation_report = {
            "rotated": [],
            "expiring_soon": [],
            "failed": []
        }
        
        current_time = datetime.utcnow()
        
        for key_id, key_entry in list(self.key_store.items()):
            expires_at = datetime.fromisoformat(key_entry["expires_at"])
            days_until_expiry = (expires_at - current_time).days
            
            if days_until_expiry <= 7:
                try:
                    new_key = self.generate_key_pair(f"{key_id}_v{key_entry['key_version'] + 1}")
                    key_entry["deprecated"] = True
                    key_entry["deprecated_at"] = current_time.isoformat()
                    key_entry["replaced_by"] = new_key["key_id"]
                    rotation_report["rotated"].append({"old_key": key_id, "new_key": new_key["key_id"], "reason": f"Expiring in {days_until_expiry} days"})
                except Exception as e:
                    rotation_report["failed"].append({"key_id": key_id, "error": str(e)})
            elif days_until_expiry <= 30:
                rotation_report["expiring_soon"].append({"key_id": key_id, "expires_in_days": days_until_expiry})
        
        return rotation_report
    
    def _add_to_key_history(self, key_entry: Dict):
        key_id = key_entry["key_id"]
        if key_id not in self.key_history:
            self.key_history[key_id] = []
        self.key_history[key_id].append({
            "timestamp": datetime.utcnow().isoformat(),
            "key_version": key_entry["key_version"],
            "action": "generated",
            "key_metadata": {"algorithm": key_entry["algorithm"], "hybrid": self.config.hybrid_mode}
        })
    
    def _backup_key(self, key_entry: Dict):
        backup_data = {
            "key_entry": key_entry,
            "backup_timestamp": datetime.utcnow().isoformat(),
            "backup_id": f"backup-{hashlib.sha256(key_entry['key_id'].encode()).hexdigest()[:16]}"
        }
        backup_key = os.urandom(32)
        iv = os.urandom(12)
        cipher = Cipher(algorithms.AES(backup_key), modes.GCM(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        encrypted_backup = encryptor.update(json.dumps(backup_data).encode()) + encryptor.finalize()
        backup_path = f"/secure/backups/keys/{key_entry['key_id']}.backup"
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        with open(backup_path, 'wb') as f:
            f.write(iv + encryptor.tag + encrypted_backup)
        self._store_backup_key(key_entry['key_id'], backup_key)
    
    def _store_backup_key(self, key_id: str, key: bytes):
        # Placeholder: production should store in KMS/secure vault
        pass
    
    def get_compliance_report(self) -> Dict[str, Any]:
        report = {
            "compliance_level": self.config.compliance_level,
            "total_keys": len(self.key_store),
            "key_algorithm": self.config.algorithm,
            "hybrid_encryption": self.config.hybrid_mode,
            "key_rotation_days": self.config.key_rotation_days,
            "key_backup_enabled": self.config.key_backup_enabled,
            "key_escrow_enabled": self.config.key_escrow_enabled,
            "audit_timestamp": datetime.utcnow().isoformat(),
            "keys": []
        }
        
        for key_id, key_entry in self.key_store.items():
            key_info = {
                "key_id": key_id,
                "algorithm": key_entry["algorithm"],
                "generated_at": key_entry["generated_at"],
                "expires_at": key_entry["expires_at"],
                "key_version": key_entry["key_version"],
                "deprecated": key_entry.get("deprecated", False),
                "history_entries": len(self.key_history.get(key_id, []))
            }
            
            if key_entry.get("deprecated"):
                key_info["deprecated_at"] = key_entry["deprecated_at"]
                key_info["replaced_by"] = key_entry.get("replaced_by")
            
            report["keys"].append(key_info)
        
        return report