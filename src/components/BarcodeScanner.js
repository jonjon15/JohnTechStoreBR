import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-barcode-scanner';
import '../styles/BarcodeScanner.css';

const BarcodeScanner = ({ onScanResult, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (result) => {
    if (result) {
      console.log('Código escaneado:', result);
      setScanResult(result);
      setScanning(false);
      
      // Chama a função de callback com o resultado
      if (onScanResult) {
        onScanResult(result);
      }
    }
  };

  const handleError = (error) => {
    console.error('Erro no scanner:', error);
    setError('Erro ao acessar a câmera. Verifique as permissões.');
  };

  const startNewScan = () => {
    setScanResult(null);
    setError(null);
    setScanning(true);
  };

  const previewStyle = {
    height: 300,
    width: '100%',
    maxWidth: 400,
    borderRadius: '12px',
    overflow: 'hidden'
  };

  return (
    <div className="barcode-scanner-container">
      <div className="scanner-header">
        <h3>📷 Scanner de Código de Barras</h3>
        <button 
          className="close-btn"
          onClick={onClose}
          aria-label="Fechar scanner"
        >
          ✕
        </button>
      </div>

      <div className="scanner-content">
        {scanning && !error && (
          <div className="scanner-camera">
            <QrReader
              delay={300}
              style={previewStyle}
              onError={handleError}
              onScan={handleScan}
              facingMode="environment" // Câmera traseira por padrão
            />
            <div className="scan-overlay">
              <div className="scan-frame"></div>
            </div>
            <p className="scan-instruction">
              📱 Aponte a câmera para o código de barras
            </p>
          </div>
        )}

        {error && (
          <div className="scanner-error">
            <div className="error-icon">⚠️</div>
            <h4>Erro de Acesso à Câmera</h4>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                className="retry-btn"
                onClick={startNewScan}
              >
                🔄 Tentar Novamente
              </button>
              <button 
                className="close-btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {scanResult && !scanning && (
          <div className="scan-success">
            <div className="success-icon">✅</div>
            <h4>Código Escaneado!</h4>
            <div className="result-code">
              <strong>{scanResult}</strong>
            </div>
            <div className="success-actions">
              <button 
                className="search-btn"
                onClick={() => onScanResult(scanResult)}
              >
                🔍 Buscar Produto
              </button>
              <button 
                className="new-scan-btn"
                onClick={startNewScan}
              >
                📷 Novo Scan
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="scanner-tips">
        <h5>💡 Dicas para melhor escaneamento:</h5>
        <ul>
          <li>📱 Mantenha o código de barras bem iluminado</li>
          <li>📏 Deixe uma distância de 10-20cm</li>
          <li>📐 Mantenha o código reto e centralizado</li>
          <li>🔍 Aguarde o foco automático</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanner;
