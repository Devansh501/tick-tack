<div align="center">
  <h1>🎮 Real-Time Multiplayer Tic-Tac-Toe</h1>
  <p>
    <b>A server-authoritative, real-time multiplayer game.</b>
  </p>
  <p>
    Demonstrating a decoupled architecture using a React frontend and a Nakama game server backend, connected via secure WebSockets.
  </p>

  <h3>
    🔴 <a href="http://dev-tick-tack.surge.sh/">Play the Live Demo Here</a> 🔴
  </h3>

  <div>
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Backend-Nakama-3399FF?style=for-the-badge" alt="Nakama" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Hosting-Oracle_Cloud-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Cloud" />
  </div>
  <br />
</div>

<hr />

<h2>🏗️ Architecture & Design Decisions</h2>
<p>
  This application is built with a focus on real-time performance, scalability, and secure network communication.
</p>
<ul>
  <li><strong>Frontend (Client):</strong> Built with <code>React.js</code>. React was chosen for its efficient component-based UI rendering, which is ideal for managing the rapidly changing state of a game board. The client uses the official Nakama JavaScript SDK to handle authentication, matchmaking, and real-time state synchronization over WebSockets.</li>
  <li><strong>Backend (Game Server):</strong> Powered by <strong>Nakama</strong> (by Heroic Labs) running alongside a <strong>PostgreSQL</strong> database. Nakama was selected because it provides out-of-the-box infrastructure for user authentication, server-authoritative multiplayer logic, and real-time socket connections, preventing client-side cheating.</li>
  <li><strong>Hosting & Infrastructure:</strong> The backend is hosted on an <strong>Oracle Cloud ARM</strong> instance using Docker.</li>
  <li><strong>Networking & Security:</strong> To resolve Mobile browser Mixed Content (HTTP/HTTPS) and CORS policies, the architecture implements <strong>Cloudflare Tunnels</strong>. This creates a secure, encrypted HTTPS/WSS tunnel directly to the Nakama instance, ensuring compatibility and secure data transmission.</li>
</ul>

<hr />

<h2>🚀 Setup & Installation (Local Development)</h2>

<details>
  <summary><b>1. Backend Setup (Nakama)</b></summary>
  <br />
  <p>Navigate to your backend directory containing the <code>docker-compose.yml</code> file and start the server:</p>
  <pre><code>docker compose up -d</code></pre>
  <p>The Nakama server will now be running on <code>http://127.0.0.1:7350</code>.</p>
</details>

<details>
  <summary><b>2. Frontend Setup (React)</b></summary>
  <br />
  <p>Navigate to the client directory and install dependencies:</p>
  <pre><code>npm install</code></pre>
  <p>Ensure the Nakama Client initialization in <code>src/App.js</code> is pointed to your local server:</p>
  <pre><code>const client = new Client("defaultkey", "127.0.0.1", "7350", false);</code></pre>
  <p>Start the development server:</p>
  <pre><code>npm start</code></pre>
  <p>Open <code>http://localhost:3000</code> in your browser. Open a second window to test multiplayer matchmaking!</p>
</details>

<hr />

<h2>🌍 Deployment Process</h2>
<p>
  The production deployment decouples the frontend and backend, utilizing secure tunneling to ensure reliable connections across all devices (including strict mobile browsers).
</p>

<h3>Phase 1: Backend Deployment (Oracle Cloud)</h3>
<ol>
  <li><strong>Provision Server:</strong> Spin up an Oracle Cloud ARM instance and configure the VCN ingress rules.</li>
  <li><strong>Deploy Container:</strong> SSH into the server, transfer the config, and spin up the containers using Docker.</li>
  <li>
    <strong>Establish Secure Tunnel:</strong>
    <ul>
      <li>Install <code>cloudflared</code> and <code>pm2</code>.</li>
      <li>Start the tunnel and expose port 7350: <br/> <code>pm2 start cloudflared --name "nakama-tunnel" -- tunnel --url http://localhost:7350</code></li>
      <li>Run <code>pm2 startup</code> and <code>pm2 save</code>.</li>
    </ul>
  </li>
</ol>

<h3>Phase 2: Frontend Deployment (Surge)</h3>
<ol>
  <li>
    <strong>Update Client Config:</strong> Open <code>src/App.js</code> and update the Nakama client to use the secure Cloudflare tunnel. Set <code>useSSL</code> to <code>true</code> and the port to <code>443</code>.
  </li>
  <li>
    <strong>Build the Application:</strong> Compile the React app for production.
    <pre><code>npm run build</code></pre>
  </li>
  <li>
    <strong>Deploy:</strong> Use the Surge CLI to deploy the static build folder to a public URL.
    <pre><code>cd build<br/>surge --domain dev-tick-tack.surge.sh</code></pre>
  </li>
</ol>

<br/>
<div align="center">
  <p><i>Built with ☕ and perseverance.</i></p>
</div>
