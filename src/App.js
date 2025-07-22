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
  const [isMinting, setIsMinting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [packageId, setPackageId] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  // Form states
  const [mintForm, setMintForm] = useState({
    customerId: '',
    imageUrl: ''
  });

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Agentic Action 1: Generate Image via Backend
  const handleGenerateImage = async () => {
    if (!imagePrompt) {
      alert('Please describe the image you want to generate.');
      return;
    }
    setIsGeneratingImage(true);
    setMintForm({ ...mintForm, imageUrl: '' }); // Clear previous image
    try {
      const response = await fetch('http://localhost:8000/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get image from AI agent.');
      }

      const data = await response.json();
      setMintForm({ ...mintForm, imageUrl: data.imageUrl });

    } catch (error) {
      console.error('Image generation error:', error);
      alert(error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleMintChange = (e) => {
    setMintForm({ ...mintForm, [e.target.name]: e.target.value });
  };

  // Agentic Action 2: Mint the NFT with the generated data
  const mintLoyalty = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!packageId.trim()) {
      alert('Please enter a valid Package ID.');
      return;
    }

    setIsMinting(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::loyalty_card::mint_loyalty`,
        arguments: [
          tx.pure.address(mintForm.customerId),
          tx.pure.string(mintForm.imageUrl)
        ]
      });
      
      const result = await signAndExecute({ transaction: tx });
      
      alert(`NFT minted successfully! Digest: ${result.digest}`);
      // Reset form for the next creation
      setMintForm({ ...mintForm, imageUrl: '' });
      setImagePrompt('');
    } catch (error) {
      console.error('Error minting loyalty card:', error);
      alert(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };
  
  // Auto-fill recipient address when wallet is connected
  useEffect(() => {
    if (currentAccount) {
      setMintForm(prev => ({ ...prev, customerId: currentAccount.address }));
    } else {
      setMintForm(prev => ({ ...prev, customerId: '' }));
    }
  }, [currentAccount]);

  const isLoading = isMinting || isGeneratingImage;

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

      {/*-- Step 1: Image Generation --*/}
      <section className="form-section">
        <h2>1. Describe Your NFT Image</h2>
        <label>AI Prompt</label>
        <input
          type="text"
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="pokemon of fire"
          disabled={isLoading}
        />
        <button onClick={handleGenerateImage} disabled={isLoading || !imagePrompt.trim()}>
          {isGeneratingImage ? 'Generating...' : 'Generate Image with AI'}
        </button>
      </section>

      {/*-- Step 2: Minting --*/}
      <section className="form-section">
        <h2>2. Mint Your NFT</h2>
        
        {/* Image Preview Area */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isGeneratingImage ? (
            <p>Generating NFT Image...</p>
          ) : mintForm.imageUrl ? (
            <img 
              src={mintForm.imageUrl} 
              alt="Generated NFT" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--input-bg)' }} 
            />
          ) : (
            <p style={{color: 'rgba(255,255,255,0.5)'}}>Image preview will appear here</p>
          )}
        </div>
        
        <label>Recipient Wallet Address</label>
        <input
          type="text"
          name="customerId"
          value={mintForm.customerId}
          onChange={handleMintChange}
          placeholder="Connect wallet or enter address"
          disabled={isLoading}
        />
        <label>Image URL (auto-filled by AI)</label>
        <input
          type="text"
          name="imageUrl"
          value={mintForm.imageUrl}
          onChange={handleMintChange}
          placeholder="https://source.unsplash.com/..."
          disabled={isLoading}
          readOnly 
        />
        <button 
          onClick={mintLoyalty} 
          disabled={
            isLoading || 
            !mintForm.customerId.trim() || 
            !mintForm.imageUrl.trim() ||
            !packageId.trim()
          }
          // Style override to match the darker red button in the image
          style={{'--accent-color': '#b33e38'}}
        >
          {isMinting ? 'Minting...' : 'Mint Your NFT'}
        </button>
      </section>
    </div>
  );
};

export default LoyaltyCardPage;