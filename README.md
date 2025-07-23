# AI-Powered NFT Minter on the Sui Blockchain

<img width="531" height="1035" alt="Screenshot 2025-07-23 210034" src="https://github.com/user-attachments/assets/1a092663-2f5d-4759-b302-0808fb7ed31c" />

*   **🤖 AI Image Generation**: Users enter a text prompt, and a backend service uses the Gemini AI API to generate a unique image.
*   **☁️ Cloud Image Hosting**: Generated images are automatically uploaded to Cloudinary for reliable, fast hosting before being minted.
*   **⛓️ On-Chain Minting**: Seamlessly mints the generated art as a standard NFT on the Sui Testnet.
*   **🛍️ Batch Minting**: Users can generate and mint multiple unique NFTs.

*   ## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later recommended)
*   [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed and configured with a devnet/testnet address.

### Installation & Setup

1.  **Clone the Repository**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install Dependencies**
    This single command will install dependencies for both the root React app and the server.
    ```sh
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root of the project. This file holds all your secret keys and is ignored by Git.

    ```sh
    touch .env
    ```
    Now, open the `.env` file and add the following, replacing the placeholder values with your actual keys:

    ```ini
    # --- Keys for Google AI ---
    GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"

    # --- Keys for Cloudinary ---
    CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
    CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY"
    CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET"
    ```

4.  **Deploy the Sui Smart Contract**
    Navigate to your Sui smart contract directory and publish it using the Sui CLI.
    ```sh
    # Example path, adjust if yours is different
    cd sui_contract/
    sui client publish --gas-budget 50000000
    ```
    After deployment, the CLI will output the **Package ID**. Copy this ID. You will need to paste it into the UI of the running application.

5.  **Run the Backend Server**
    From the project root directory, run:
    ```sh
    node server/server.js
    ```
    You should see the confirmation message: `✅ AI Agent server listening at http://localhost:8000`

6.  **Run the Frontend Application**
    In a new terminal, also from the project root directory, run:
    ```sh
    npm start
    ```
    This will open the application in your browser at `http://localhost:3000`.

---
