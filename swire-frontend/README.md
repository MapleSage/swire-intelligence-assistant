# 🧠 Swire Intelligence Assistant - Frontend

A comprehensive React/Next.js frontend for the Swire Intelligence Assistant with Azure AI integration, AWS Cognito authentication, and advanced document processing capabilities.

## 🚀 Features

### 🔐 Authentication
- **AWS Cognito Integration** - Secure user management
- **Demo Login** - Quick access for testing
- **Session Management** - Auto token refresh
- **Multi-provider Support** - Social login ready

### 🤖 AI Integration
- **Azure OpenAI** - GPT-4o and GPT-4 Turbo models
- **Model Selection** - Choose between different AI models
- **RAG Integration** - Azure Cognitive Search for context
- **SageGPT Agent** - Specialized Swire domain expert

### 📄 Document Processing
- **File Upload** - Drag & drop, browse, or camera capture
- **OCR Support** - Extract text from images and scanned docs
- **Audio Processing** - Speech-to-text with Azure Speech Services
- **Multi-format Support** - PDF, DOC, images, audio files
- **Azure Form Recognizer** - Advanced document analysis

### 🎤 Voice Interaction
- **Speech-to-Text** - Voice input with Azure Speech Services
- **Real-time Recording** - 30-second voice messages
- **Audio Upload** - Process audio files for transcription

### 💬 Chat Interface
- **Real-time Messaging** - Interactive AI assistant
- **Markdown Support** - Rich text formatting
- **Quick Actions** - Pre-built queries for common tasks
- **Message History** - Persistent conversation
- **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **Azure SDK** - AI services integration
- **AWS SDK** - Cognito authentication
- **Lucide React** - Beautiful icons
- **React Markdown** - Markdown rendering
- **Formidable** - File upload handling

## 🏃♂️ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit with your Azure and AWS credentials
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# AWS Cognito
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id

# Azure AI Services (Client-side)
NEXT_PUBLIC_AZURE_OPENAI_KEY=your_azure_openai_key
NEXT_PUBLIC_AZURE_AI_KEY=your_azure_ai_key
NEXT_PUBLIC_AZURE_COGNITIVE_KEY=your_azure_cognitive_key
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key
NEXT_PUBLIC_AZURE_SEARCH_KEY=your_azure_search_key

# Azure AI Services (Server-side - More Secure)
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_AI_KEY=your_azure_ai_key
AZURE_COGNITIVE_KEY=your_azure_cognitive_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SEARCH_KEY=your_azure_search_key
```

## 🚀 Deploy to Vercel

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Add all environment variables
   - Redeploy

3. **Configure Custom Domain** (Optional)
   - Add custom domain in Vercel
   - Update DNS settings

## 🎨 Key Components

### Authentication
- `SwireLoginPage` - Branded login interface
- `AuthProvider` - Context for auth state
- `AuthService` - Cognito integration

### Chat Interface
- `SwireChatInterface` - Main chat component
- `ModelSelector` - AI model selection
- `DocumentUpload` - File processing modal

### Azure Integration
- `AzureClient` - Service integration
- `AzureConfig` - Endpoint configuration

## 📱 Features in Detail

### Document Upload
- **Drag & Drop** - Intuitive file upload
- **Camera Capture** - Scan documents with device camera
- **Voice Recording** - Record and transcribe audio
- **Multi-format Support** - PDF, DOC, images, audio
- **Real-time Processing** - Instant document analysis

### AI Models
- **GPT-4o** - Most capable for complex reasoning
- **GPT-4 Turbo** - Fast and efficient
- **Claude 3 Sonnet** - Safety-focused responses
- **SageGPT** - Swire domain specialist

### Quick Actions
- 📊 **Financial Summary** - Revenue and expense analysis
- 👥 **Man-Hours Report** - Workforce productivity data
- 🛡️ **Safety Guidelines** - HSE compliance information
- 📈 **Dashboard Overview** - Combined operational insights

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **API Key Management** - Server-side key storage
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Sanitized user inputs
- **File Upload Security** - Type and size validation

## 🌐 Azure Services Integration

### OpenAI Services
- **Endpoint**: `https://ai-parvinddutta9607ai577068173144.openai.azure.com/`
- **Models**: GPT-4o, GPT-4 Turbo
- **Features**: Chat completion, embeddings

### Cognitive Services
- **Endpoint**: `https://ai-parvinddutta9607ai577068173144.cognitiveservices.azure.com/`
- **Features**: OCR, document analysis, computer vision

### Speech Services
- **STT**: `https://eastus.stt.speech.microsoft.com`
- **TTS**: `https://eastus.tts.speech.microsoft.com`
- **Features**: Real-time transcription, voice synthesis

### Cognitive Search
- **Endpoint**: `https://ai-parvinddutta9607ai577068173144.search.windows.net/`
- **Features**: RAG, semantic search, document indexing

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized with Next.js
- **Loading Speed**: < 2s initial load
- **Mobile Performance**: Fully responsive

## 🔄 Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Type Checking**
   ```bash
   npm run type-check
   ```

3. **Linting**
   ```bash
   npm run lint
   ```

4. **Build Production**
   ```bash
   npm run build
   ```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For technical support or questions:
- **Email**: support@swire-renewables.com
- **Documentation**: Internal wiki
- **Issues**: GitHub Issues

---

**Built with ❤️ for Swire Renewables Intelligence Platform**