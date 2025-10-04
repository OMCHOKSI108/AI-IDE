# AI-IDE - Web-based Integrated Development Environment

A local-first, open-source web IDE with Google Drive integration, similar to GitHub Codespaces and Google Colab.

## 🚀 Features

- **Full-Featured Editor**: Monaco Editor (VS Code's editor) with syntax highlighting
- **Integrated Terminal**: Browser-based terminal with Docker container execution
- **Google Drive Integration**: Seamless project storage and synchronization
- **Language Intelligence**: LSP support for Python and JavaScript
- **Secure Execution**: Docker-based sandboxing with resource limits
- **Local-First**: Works offline with background cloud sync

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ Runner/Executor │
│                 │    │                 │    │                 │
│ React + Vite    │◄──►│ Node.js + Express│◄──►│ Docker Containers│
│ Monaco Editor   │    │ REST + WebSocket│    │ Language Runtimes│
│ xterm.js        │    │ Authentication  │    │ Sandboxed Env   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React with Vite
- **Editor**: Monaco Editor
- **Terminal**: xterm.js
- **Styling**: Modern CSS
- **State**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: Google OAuth2
- **File Storage**: Google Drive API

### Infrastructure
- **Containers**: Docker for secure code execution
- **Development**: Docker Compose
- **Languages**: Python 3.11, Node.js 18

## 🚦 Quick Start

### Prerequisites
- Node.js 18+ (LTS)
- Docker Desktop
- Git
- Google Cloud Console project (for OAuth)

### 1. Clone and Setup
```bash
git clone https://github.com/OMCHOKSI108/AI-IDE.git
cd AI-IDE
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Google OAuth credentials
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# SESSION_SECRET=your_random_secret
# MONGODB_URI=mongodb://localhost:27017/ai-ide
```

### 3. Start Development Environment
```bash
# Install dependencies and start all services
npm run setup
npm run dev

# Or using Docker Compose
docker-compose -f infra/docker-compose.dev.yml up
```

### 4. Access the IDE
- Open http://localhost:3000
- Authenticate with Google
- Start coding!

## 📁 Project Structure

```
/
├── frontend/                 # React + Vite client
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API clients
│   │   ├── hooks/           # Custom hooks
│   │   └── context/         # React contexts
│   └── package.json
├── backend/                  # Node.js API + orchestrator
│   ├── src/
│   │   ├── controllers/     # REST handlers
│   │   ├── services/        # Business logic
│   │   ├── lib/             # Core libraries
│   │   └── models/          # Data models
│   └── package.json
├── runner-images/           # Docker configurations
│   ├── python/              # Python runtime
│   └── node/                # Node.js runtime
├── infra/                   # DevOps configurations
├── scripts/                 # Development scripts
├── docs/                    # Project documentation
└── README.md
```

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm install
npm run dev          # Start with nodemon
npm run start        # Start production server
npm test             # Run tests
```

### Docker Images
```bash
# Build runner images
docker build -t ai-ide/python-runner runner-images/python/
docker build -t ai-ide/node-runner runner-images/node/

# Or build all images
npm run build:images
```

## 🔐 Security

- **Container Isolation**: All code executes in isolated Docker containers
- **Resource Limits**: CPU, memory, and process constraints
- **Non-root Execution**: Containers run as unprivileged users
- **Network Isolation**: No internet access by default
- **Token Security**: Encrypted OAuth token storage

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- **[Requirements](docs/project-requirements.md)** - Functional and technical requirements
- **[Design](docs/project-design.md)** - System architecture and API specifications
- **[Work Plan](docs/project-work.md)** - Sprint breakdown and implementation plan
- **[Completion Guide](docs/project-done.md)** - Deployment and verification checklist

## 🚀 Deployment

### Local Production
```bash
# Build all components
npm run build

# Start production services
docker-compose -f infra/docker-compose.prod.yml up
```

### Cloud Deployment
- **Render**: Deploy using Docker
- **Railway**: Git-based deployment
- **Self-hosted**: VPS with Docker Compose

See [deployment documentation](docs/deployment.md) for detailed instructions.

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** following our coding standards
4. **Add tests** for new functionality
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

### Development Standards
- **Code Style**: ESLint + Prettier
- **Testing**: Jest for unit tests, Cypress for E2E
- **Documentation**: JSDoc for code, Markdown for features
- **Security**: All security changes require review

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - VS Code's editor in the browser
- **xterm.js** - Terminal emulator for the web
- **Docker** - Container platform for secure execution
- **Google Drive API** - Cloud storage integration
- **Open Source Community** - For amazing tools and libraries

## 📞 Support

- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Community support and questions
- **Documentation**: Comprehensive guides in `/docs`
- **Wiki**: Tips, tricks, and advanced configuration

---

**Built with ❤️ by the AI-IDE Team**

*Making web development accessible, secure, and collaborative.*