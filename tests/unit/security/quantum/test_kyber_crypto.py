import pytest
from security.quantum.kyber_crypto import QuantumResistantCrypto, QuantumKeyConfig


def test_key_generation_and_encrypt_decrypt(monkeypatch):
    cfg = QuantumKeyConfig(hybrid_mode=False)
    qrc = QuantumResistantCrypto(cfg)

    # Force a deterministic derived encryption key for both encrypt and decrypt
    monkeypatch.setattr(qrc, "_derive_encryption_key", lambda shared_secret: b"0" * 32)

    info = qrc.generate_key_pair("test-key-1")
    assert info["key_id"] == "test-key-1"
    assert "public_key" in info

    plaintext = b"hello quantum world"
    encrypted = qrc.encrypt(plaintext, "test-key-1")
    assert "encrypted_data" in encrypted

    decrypted = qrc.decrypt(encrypted, "test-key-1")
    assert decrypted == plaintext

    report = qrc.get_compliance_report()
    assert report["total_keys"] >= 1
