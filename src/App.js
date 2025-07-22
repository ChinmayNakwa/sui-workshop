import React, { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import {
  useSignAndExecuteTransaction,
  ConnectButton,
  useCurrentAccount
} from '@mysten/dapp-kit';
import './App.css';

const LoyaltyCardPage = () => {
  const currentAccount = useCurrentAccount();
  const [status, setStatus] = useState('idle'); // 'generating', 'minting', 'idle'
  const [packageId, setPackageId] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [mintForm, setMintForm] = useState({
    customerId: '',
    imageUrls: []
  });

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const handleGenerateImages = async () => {
    if (!imagePrompt) {
      alert('Please describe the image(s) you want to generate.');
      return;
    }
    setStatus('generating');
    setMintForm(prev => ({ ...prev, imageUrls: [] }));
    try {
      const response = await fetch('http://localhost:8000/generate-batch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, count: quantity }),
      });

      const data = await response.json();

      // Check for a server-side error message in the JSON response
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to get images from AI agent.');
      }

      setMintForm(prev => ({ ...prev, imageUrls: data.imageUrls }));

    } catch (error) {
      console.error('Image generation fetch error:', error);
      alert(`Error generating images: ${error.message}`);
    } finally {
      setStatus('idle');
    }
  };

  const handleFormChange = (e) => {
    setMintForm({ ...mintForm, [e.target.name]: e.target.value });
  };

  const mintLoyaltyBatch = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!packageId.trim()) {
      alert('Please enter a valid Package ID.');
      return;
    }
    if (mintForm.imageUrls.length === 0) {
      alert('Please generate images before minting.');
      return;
    }

    setStatus('minting');
    try {
      const tx = new Transaction();
      for (const imageUrl of mintForm.imageUrls) {
        tx.moveCall({
          target: `${packageId}::loyalty_card::mint_loyalty`,
          arguments: [
            tx.pure.address(mintForm.customerId),
            tx.pure.string(imageUrl)
          ]
        });
      }
      
      const result = await signAndExecute({ transaction: tx });
      
      alert(`Batch mint successful! ${mintForm.imageUrls.length} NFTs minted. Digest: ${result.digest}`);
      
      setMintForm(prev => ({ ...prev, imageUrls: [] }));
      setImagePrompt('');
      setQuantity(1);

    } catch (error) {
      console.error('Error minting loyalty cards:', error);
      alert(`Minting failed: ${error.message}`);
    } finally {
      setStatus('idle');
    }
  };
  
  useEffect(() => {
    if (currentAccount) {
      setMintForm(prev => ({ ...prev, customerId: currentAccount.address }));
    } else {
      setMintForm(prev => ({ ...prev, customerId: '' }));
    }
  }, [currentAccount]);

  const isLoading = status === 'generating' || status === 'minting';
  const generatedImageCount = mintForm.imageUrls.length;

  return (
    <div className="container">
      <h1>Mint Your NFT on SUI</h1>
      <ConnectButton />

      <div className="package-input form-section">
        <label>Package ID</label>
        <input
          type="text"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          placeholder="Enter the deployed Package ID"
          disabled={isLoading}
        />
      </div>

      <section className="form-section">
        <h2>1. Describe Your NFT Image(s)</h2>
        <label>AI Prompt</label>
        <input
          type="text"
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="A majestic lion king"
          disabled={isLoading}
        />
        <label>Quantity (1-10)</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
          min="1"
          max="10"
          disabled={isLoading}
          style={{marginBottom: '1rem'}}
        />
        <button onClick={handleGenerateImages} disabled={isLoading || !imagePrompt.trim()}>
          {status === 'generating' ? `Generating ${quantity} Image(s)...` : `Generate ${quantity} Image(s) with AI`}
        </button>
      </section>

      <section className="form-section">
        <h2>2. Mint Your NFT(s)</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {status === 'generating' ? (
            <p>Generating NFT Images...</p>
          ) : generatedImageCount > 0 ? (
            mintForm.imageUrls.map((url, index) => (
              <img 
                key={index}
                src={url} 
                alt={`Generated NFT ${index + 1}`}
                style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--input-bg)' }} 
              />
            ))
          ) : (
            <p style={{color: 'rgba(255,255,255,0.5)'}}>Image previews will appear here</p>
          )}
        </div>
        
        <label>Recipient Wallet Address</label>
        <input
          type="text"
          name="customerId"
          value={mintForm.customerId}
          onChange={handleFormChange}
          placeholder="Connect wallet or enter address"
          disabled={isLoading}
        />
        <button 
          onClick={mintLoyaltyBatch} 
          disabled={
            isLoading || 
            !mintForm.customerId.trim() || 
            generatedImageCount === 0 ||
            !packageId.trim()
          }
          style={{'--accent-color': '#b33e38'}}
        >
          {status === 'minting' ? 'Minting...' : `Mint ${generatedImageCount} NFT(s)`}
        </button>
      </section>
    </div>
  );
};

export default LoyaltyCardPage;