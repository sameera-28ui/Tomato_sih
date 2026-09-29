import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bug, Camera, Check, CheckCircle2, CircleHelp, Clock3, FileImage, FolderOpen, History as HistoryIcon, Home, Info, Leaf, Menu, RefreshCw, ScanSearch, Search, ShieldCheck, Sprout, Target, Trash2, UploadCloud, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'
import './App.css'
import './Camera.css'

const API_URL = 'http://127.0.0.1:8001/predict'
const HISTORY_KEY = 'tomatoguard-history'
const LanguageContext = createContext(null)

const translations = {
  en: {
    language: '🌐 English',
    dashboard: 'Dashboard',
    analyze: 'Analyze Crop',
    results: 'AI Results',
    insights: 'Insights',
    recommendations: 'Recommendations',
    history: 'History',
    how: 'How AI Works',
    workspace: 'Workspace',
    online: 'Models Online',
    active: '3 specialists active',
    morning: 'Good morning, farmer.',
    hero: 'Grow with more certainty.',
    heroText: 'Upload a tomato leaf and let TomatoGuard detect disease, pests, and Tuta absoluta in seconds.',
    start: 'Analyze a Leaf',
    overview: 'Farm Overview',
    analyses: 'Total Analyses',
    noScan: 'No scan yet',
    stored: 'Stored locally',
    lab: 'Analysis Lab / New Scan',
    analyzeTitle: 'Analyze a Crop.',
    analyzeText: 'One image. Three specialist models. A clearer next step.',
    leaf: 'Leaf Image',
    upload: 'Upload Image',
    drop: 'Drop your tomato leaf image here',
    browse: 'Browse Image',
    readyImage: 'Image Ready',
    analyzeCrop: 'Analyze Crop',
    remove: 'Remove Image',
    scanning: 'AI is scanning the leaf...',
    resultsTitle: 'Your Crop Report.',
    complete: 'Analysis Complete',
    findings: 'Model Findings',
    detected: 'Detected',
    uncertain: 'Uncertain',
    warning: 'AI Confidence Warning',
    warningText: 'Some findings are below 70%. Consider a clearer image or an in-field check.',
    healthy: 'Crop Appears Healthy',
    healthyText: 'The AI did not find strong disease or pest signals in this image.',
    actions: 'View Recommendations',
    noResults: 'No Results to Show',
    noResultsText: 'Run an analysis to see disease, pest, and Tuta findings here.',
    confidence: 'confidence',
    high: 'High confidence signal',
    low: 'Below 70% confidence threshold',
    noRecs: 'Recommendations Appear After a Scan',
    noRecsText: 'Upload a tomato leaf and detected findings will bring their care notes here.',
    noAction: 'No Action Signals Right Now',
    noActionText: 'No strong recommendations were produced for this scan.',
    prediction: 'Prediction',
    status: 'Status',
    overallResult: 'Overall Result',
    nonTomatoTitle: '❌ Not a Tomato Image',
    nonTomatoText: 'This image does not appear to contain a tomato plant.\n\nPlease upload a clear tomato leaf, tomato fruit,\nor tomato plant image.',
    validationUncertainTitle: '⚠️ Image Validation Uncertain',
    validationUncertainText: 'Please upload a clearer tomato image.',
    uploadAnother: 'Upload Another Image',
    emptyHistory: 'No analyses yet',
    emptyHistoryText: 'Upload a tomato image to start your first AI analysis.',
    deleteConfirm: 'Delete this analysis?',
    deleteConfirmText: 'This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteSuccess: 'Analysis deleted successfully.',
    date: 'Date & Time',
    viewDetails: 'View Details',
    invalidImage: 'Invalid image. Please upload a valid JPG, JPEG or PNG image.',
    backendOffline: 'We could not reach the AI service.',
    backendOfflineText: 'Make sure the backend is running on port 8001.',
    useCamera: 'Use Camera',
    browseFiles: 'Browse Files',
    cameraDescription: 'Capture a fresh tomato crop image',
    browseDescription: 'Upload an existing tomato crop image',
    openCamera: 'Open Camera',
    capturePhoto: 'Capture Photo',
    retake: 'Retake',
    chooseImage: 'Choose Image',
    selectedImage: 'Selected Image',
    fileSize: 'File size',
    invalidResponse: 'The AI service returned an invalid response.'
  },
  te: {
    language: '🌐 తెలుగు',
    dashboard: 'డ్యాష్‌బోర్డ్',
    analyze: 'పంటను విశ్లేషించండి',
    results: 'AI ఫలితాలు',
    insights: 'అవగాహనలు',
    recommendations: 'సిఫార్సులు',
    history: 'చరిత్ర',
    how: 'AI ఎలా పనిచేస్తుంది',
    workspace: 'వర్క్‌స్పేస్',
    online: 'మోడళ్లు ఆన్‌లైన్',
    active: '3 నిపుణులు యాక్టివ్',
    morning: 'శుభోదయం, రైతు.',
    hero: 'మరింత నమ్మకంతో సాగు చేయండి.',
    heroText: 'టమాటా ఆకును అప్‌లోడ్ చేయండి. TomatoGuard వ్యాధి, పురుగు మరియు Tuta absolutaను గుర్తిస్తుంది.',
    start: 'ఆకును విశ్లేషించండి',
    overview: 'పంట అవలోకనం',
    analyses: 'మొత్తం విశ్లేషణలు',
    noScan: 'ఇంకా విశ్లేషణ లేదు',
    stored: 'స్థానికంగా భద్రపరచబడింది',
    lab: 'విశ్లేషణ ల్యాబ్ / కొత్త స్కాన్',
    analyzeTitle: 'పంటను విశ్లేషించండి.',
    analyzeText: 'ఒక చిత్రం. మూడు నిపుణ మోడళ్లు. మరింత స్పష్టమైన తదుపరి అడుగు.',
    leaf: 'ఆకు చిత్రం',
    upload: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    drop: 'టమాటా ఆకు చిత్రాన్ని ఇక్కడ వదలండి',
    browse: 'చిత్రాన్ని ఎంచుకోండి',
    readyImage: 'చిత్రం సిద్ధంగా ఉంది',
    analyzeCrop: 'AI విశ్లేషణ ప్రారంభించండి',
    remove: 'చిత్రాన్ని తొలగించండి',
    scanning: 'చిత్రాన్ని విశ్లేషిస్తున్నారు...',
    resultsTitle: 'మీ పంట నివేదిక.',
    complete: 'విశ్లేషణ పూర్తయింది',
    findings: 'మోడల్ ఫలితాలు',
    detected: 'గుర్తించబడింది',
    uncertain: 'అనిశ్చిత',
    warning: 'AI నమ్మక స్థాయి హెచ్చరిక',
    warningText: 'కొన్ని ఫలితాలు 70% కంటే తక్కువగా ఉన్నాయి.',
    healthy: 'పంట ఆరోగ్యంగా కనిపిస్తోంది',
    healthyText: 'ఈ చిత్రంలో AI బలమైన వ్యాధి లేదా పురుగు సంకేతాలను కనుగొనలేదు.',
    actions: 'సిఫార్సులను చూడండి',
    noResults: 'ఫలితాలు లేవు',
    noResultsText: 'వ్యాధి, పురుగు మరియు Tuta ఫలితాలను చూడటానికి విశ్లేషణ చేయండి.',
    confidence: 'నమ్మక స్థాయి',
    high: 'అధిక నమ్మక సంకేతం',
    low: '70% నమ్మక పరిమితి కంటే తక్కువ',
    noRecs: 'విశ్లేషణ తర్వాత సిఫార్సులు కనిపిస్తాయి',
    noRecsText: 'టమాటా పంట చిత్రాన్ని అప్‌లోడ్ చేయండి మరియు చికిత్సా సూచనలు పొందండి.',
    noAction: 'ఇప్పుడిక్కడ చర్య సంకేతాలు లేవు',
    noActionText: 'ఈ స్కాన్ కోసం బలమైన సిఫార్సులు తయారు కాలేదు.',
    prediction: 'భావం',
    status: 'స్థితి',
    overallResult: 'మొత్తం ఫలితం',
    nonTomatoTitle: 'టమాటా చిత్రం కాదు',
    nonTomatoText: 'ఈ చిత్రం టమాటా మొక్కను చూపట్లేదు. స్థిరమైన విశ్లేషణకు స్పష్టమైన టమాటా చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    validationUncertainTitle: 'చిత్ర ధృవీకరణ అనిశ్చితంగా ఉంది',
    validationUncertainText: 'మరింత విశ్వసనీయ విశ్లేషణ కోసం స్పష్టమైన టమాటా చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    uploadAnother: 'మరొక చిత్రాన్ని అప్‌లోడ్ చేయండి',
    emptyHistory: 'ఇంకా విశ్లేషణలు లేవు',
    emptyHistoryText: 'మీ మొదటి AI విశ్లేషణ ప్రారంభించడానికి టమాటా చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    deleteConfirm: 'ఈ విశ్లేషణను తొలగించాలా?',
    deleteConfirmText: 'ఈ చర్యను తిరిగి పూర్చలేరు.',
    cancel: 'రద్దు',
    delete: 'తొలగించు',
    deleteSuccess: 'విశ్లేషణ విజయవంతంగా తొలగించబడింది.',
    date: 'తేదీ & సమయం',
    viewDetails: 'వివరాలు చూడండి',
    invalidImage: 'చెల్లని చిత్రం. సరైన JPG, JPEG లేదా PNG చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    backendOffline: 'AI సేవను చేరుకోలేకపోయాము.',
    backendOfflineText: 'బ్యాకెండ్ 8001 పోర్ట్‌లో నడుస్తున్నదని నిర్ధారించండి.',
    useCamera: 'కెమెరాను ఉపయోగించండి',
    browseFiles: 'ఫైళ్లను ఎంచుకోండి',
    cameraDescription: 'తాజా టమాటా పంట చిత్రాన్ని తీయండి',
    browseDescription: 'ఇప్పటికే ఉన్న టమాటా పంట చిత్రాన్ని అప్‌లోడ్ చేయండి',
    openCamera: 'కెమెరా తెరవండి',
    capturePhoto: 'ఫోటో తీయండి',
    retake: 'మళ్లీ తీయండి',
    chooseImage: 'చిత్రాన్ని ఎంచుకోండి',
    selectedImage: 'ఎంచుకున్న చిత్రం',
    fileSize: 'ఫైల్ పరిమాణం',
    invalidResponse: 'AI సేవ చెడ్డ స్పందన ఇచ్చింది.'
  },
  hi: {
    language: '🌐 हिंदी',
    dashboard: 'डैशबोर्ड',
    analyze: 'फसल का विश्लेषण',
    results: 'AI परिणाम',
    insights: 'जानकारियाँ',
    recommendations: 'सिफारिशें',
    history: 'इतिहास',
    how: 'AI कैसे काम करता है',
    workspace: 'वर्कस्पेस',
    online: 'मॉडल ऑनलाइन',
    active: '3 विशेषज्ञ सक्रिय',
    morning: 'सुप्रभात, किसान।',
    hero: 'अधिक भरोसे के साथ खेती करें।',
    heroText: 'टमाटर की तस्वीर अपलोड करें और TomatoGuard कुछ सेकंड में रोग, कीट और Tuta absoluta पहचानता है।',
    start: 'पत्ते का विश्लेषण करें',
    overview: 'फसल का अवलोकन',
    analyses: 'कुल विश्लेषण',
    noScan: 'अभी कोई स्कैन नहीं',
    stored: 'स्थानीय रूप से सुरक्षित',
    lab: 'विश्लेषण लैब / नया स्कैन',
    analyzeTitle: 'फसल का विश्लेषण करें।',
    analyzeText: 'एक तस्वीर। तीन विशेषज्ञ मॉडल। साफ़ अगला कदम।',
    leaf: 'पत्ते की तस्वीर',
    upload: 'तस्वीर अपलोड करें',
    drop: 'टमाटर के पत्ते की तस्वीर यहाँ डालें',
    browse: 'तस्वीर चुनें',
    readyImage: 'तस्वीर तैयार है',
    analyzeCrop: 'AI विश्लेषण शुरू करें',
    remove: 'तस्वीर हटाएँ',
    scanning: 'चित्र का विश्लेषण किया जा रहा है...',
    resultsTitle: 'आपकी फसल रिपोर्ट।',
    complete: 'विश्लेषण पूरा हुआ',
    findings: 'मॉडल के परिणाम',
    detected: 'पहचाना गया',
    uncertain: 'अस्पष्ट',
    warning: 'AI विश्वास स्तर चेतावनी',
    warningText: 'कुछ परिणाम 70% से कम हैं। अधिक स्पष्ट तस्वीर या खेत में जाँच करें।',
    healthy: 'फसल स्वस्थ दिखाई देती है',
    healthyText: 'इस तस्वीर में AI को रोग या कीट के मजबूत संकेत नहीं मिले।',
    actions: 'सिफारिशें देखें',
    noResults: 'कोई परिणाम नहीं',
    noResultsText: 'रोग, कीट और Tuta के परिणाम देखने के लिए विश्लेषण करें।',
    confidence: 'विश्वास स्तर',
    high: 'उच्च विश्वास संकेत',
    low: '70% विश्वास सीमा से कम',
    noRecs: 'विश्लेषण के बाद सिफारिशें दिखाई देंगी',
    noRecsText: 'टमाटर की तस्वीर अपलोड करें और उचित देखभाल सुझाव देखें।',
    noAction: 'अभी कोई कार्रवाई का संकेत नहीं',
    noActionText: 'इस स्कैन के लिए मजबूत सिफारिशें नहीं बनें।',
    prediction: 'प्रागुक्ति',
    status: 'स्थिति',
    overallResult: 'कुल परिणाम',
    nonTomatoTitle: 'टमाटर वाली तस्वीर नहीं है',
    nonTomatoText: 'इस तस्वीर में टमाटर की पत्ती, पौधा या फसल नहीं दिख रहा है। कृपया साफ़ टमाटर की तस्वीर अपलोड करें।',
    validationUncertainTitle: 'छवि सत्यापन अस्पष्ट है',
    validationUncertainText: 'अधिक विश्वसनीय विश्लेषण के लिए साफ़ टमाटर की तस्वीर अपलोड करें।',
    uploadAnother: 'अलग तस्वीर अपलोड करें',
    emptyHistory: 'अभी कोई विश्लेषण नहीं है',
    emptyHistoryText: 'अपना पहला AI विश्लेषण शुरू करने के लिए टमाटर की तस्वीर अपलोड करें।',
    deleteConfirm: 'इस विश्लेषण को हटाएँ?',
    deleteConfirmText: 'यह कार्य वापस नहीं किया जा सकता।',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    deleteSuccess: 'विश्लेषण सफलतापूर्वक हटाया गया।',
    date: 'तारीख़ और समय',
    viewDetails: 'विवरण देखें',
    invalidImage: 'अमान्य चित्र. सही JPG, JPEG या PNG अपलोड करें.',
    backendOffline: 'AI सेवा से कनेक्ट नहीं हो सके।',
    backendOfflineText: 'कृपया बैकएंड सर्वर चल रहा है, यह सुनिश्चित करें।',
    useCamera: 'कैमरा उपयोग करें',
    browseFiles: 'फ़ाइल चुनें',
    cameraDescription: 'टमाटर की ताज़ा फसल की तस्वीर लें',
    browseDescription: 'मौजूदा टमाटर फसल की तस्वीर अपलोड करें',
    openCamera: 'कैमरा खोलें',
    capturePhoto: 'फोटो लें',
    retake: 'दोबारा लें',
    chooseImage: 'छवि चुनें',
    selectedImage: 'चयनित छवि',
    fileSize: 'फ़ाइल का आकार',
    invalidResponse: 'AI सेवा ने अमान्य प्रतिक्रिया दी।'
  }
}

const nav = [
  ['dashboard', '/', Home],
  ['analyze', '/analyze', Target],
  ['results', '/results', Target],
  ['insights', '/insights', BarChart3],
  ['recommendations', '/recommendations', ShieldCheck],
  ['history', '/history', HistoryIcon]
]

const BugIcon = Bug
const ButterflyIcon = Sprout

const label = (value = 'unknown') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const normalizeHistory = (items = []) => Array.isArray(items) ? items.filter(Boolean) : []
const toPercent = (value) => {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return 0
  return Math.min(100, Math.max(0, num))
}

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('tomatoguard_language') || 'en')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState(() => {
    try {
      return normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))
    } catch {
      return []
    }
  })
  const [scanning, setScanning] = useState(false)
  const [loadingStage, setLoadingStage] = useState('AI is scanning the leaf...')
  const [error, setError] = useState('')
  const t = translations[lang] || translations.en

  useEffect(() => {
    if (!scanning) return undefined

    const stages = [
      'Checking image...',
      'Verifying tomato...',
      'Scanning diseases...',
      'Scanning pests...',
      'Checking Tuta absoluta...',
      'Preparing action plan...'
    ]

    let stageIndex = 0
    const timer = setInterval(() => {
      stageIndex = (stageIndex + 1) % stages.length
      setLoadingStage(stages[stageIndex])
    }, 1200)

    return () => clearInterval(timer)
  }, [scanning])

  useEffect(() => localStorage.setItem('tomatoguard_language', lang), [lang])

  const choose = (nextFile) => {
    if (!nextFile) return
    setFile(nextFile)
    setError('')
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(nextFile))
  }

  const clearSelection = () => {
    setFile(null)
    setPreview('')
    setError('')
    setAnalysis(null)
  }

  const analyze = async () => {
    if (!file) {
      setError(t.invalidImage)
      setScanning(false)
      return
    }

    setScanning(true)
    setLoadingStage('AI is scanning the leaf...')
    setError('')
    setAnalysis(null)

    console.log('Starting image analysis...')
    console.log('Sending request to backend...')
    console.log('Waiting for backend response...')

    const formData = new FormData()
    formData.append('file', file)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 180000)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Backend response received:', data)

      const reader = await new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onload = () => resolve(fileReader.result)
        fileReader.onerror = () => reject(new Error(t.invalidImage))
        fileReader.readAsDataURL(file)
      })

      const record = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        imageUrl: reader,
        result: data,
      }

      setAnalysis(record)
      setHistory((old) => {
        const next = [record, ...normalizeHistory(old)].slice(0, 20)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
        return next
      })

      console.log('Analysis completed.')
    } catch (error) {
      console.error('Prediction request failed:', error)

      if (error?.name === 'AbortError') {
        setError('Analysis is taking longer than expected. Please wait or try again.')
      } else if (error instanceof TypeError) {
        setError('Unable to connect to TomatoGuard AI. Please make sure the backend server is running.')
      } else {
        setError('TomatoGuard AI returned an error. Please try again.')
      }

      setAnalysis(null)
    } finally {
      clearTimeout(timeoutId)
      setScanning(false)
      setLoadingStage('AI is scanning the leaf...')
    }
  }

  const value = { lang, setLang, t, analysis, setAnalysis, history, setHistory, file, preview, choose, clearSelection, analyze, scanning, loadingStage, error, setError }

  return (
    <LanguageContext.Provider value={value}>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            <MobileHeader />
            <div className="page-wrap">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/results" element={<Results />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/how-ai-works" element={<HowAIWorks />} />
              </Routes>
              <footer className="app-footer">{t.online} · TomatoGuard AI</footer>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </LanguageContext.Provider>
  )
}

function Sidebar() {
  const { t, analysis, history } = useContext(LanguageContext)
  const latest = analysis || history[0]
  const geminiReady = latest?.result?.gemini_status === 'available' || latest?.result?.tomato_validation?.source === 'GEMINI'
  return (
    <aside className="sidebar">
      <Brand />
      <div className="rail-label">{t.workspace}</div>
      <nav>
        {nav.map(([key, path, Icon]) => (
          <NavLink key={key} to={path} end={path === '/'} className="nav-item">
            <Icon size={18} />
            <span>{t[key]}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/how-ai-works" className="nav-item">
          <CircleHelp size={18} />
          <span>{t.how}</span>
        </NavLink>
        <div className="model-status">
          <i className="status-dot" />
          <span>
            <b>Models online</b>
            <small>3 specialist models active</small>
          </span>
        </div>
        <div className="vision-status">
          <span><Wifi size={14} /> Gemini Vision</span>
          <b className={geminiReady ? 'available' : 'waiting'}>{geminiReady ? 'Available' : 'Awaiting scan'}</b>
        </div>
      </div>
    </aside>
  )
}

function Brand() {
  const { t } = useContext(LanguageContext)
  return (
    <div className="brand">
      <div className="brand-mark"><Leaf size={21} fill="currentColor" /></div>
      <div>
        <strong>Tomato<span>Guard</span></strong>
        <small>{t.online}</small>
      </div>
    </div>
  )
}

function MobileHeader() {
  return (
    <header className="mobile-header">
      <Brand />
      <div className="mobile-actions">
        <LanguageSwitcher compact />
        <button className="icon-button" aria-label="menu"><Menu size={20} /></button>
      </div>
    </header>
  )
}

function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, t } = useContext(LanguageContext)
  return (
    <label className={`language ${compact ? 'compact' : ''}`}>
      <select aria-label={t.language} value={lang} onChange={(event) => setLang(event.target.value)}>
        <option value="en">🌐 English</option>
        <option value="te">🌐 తెలుగు</option>
        <option value="hi">🌐 हिंदी</option>
      </select>
    </label>
  )
}

function Header({ eyebrow, title, text, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      <div className="header-tools">
        {action}
        <LanguageSwitcher compact />
      </div>
    </div>
  )
}

function Dashboard() {
  const { t, analysis, history } = useContext(LanguageContext)
  const navigate = useNavigate()
  const latest = analysis || history[0]
  const latestResult = latest?.result || null

  const stats = useMemo(() => {
    const risk = (key, clear) => {
      const value = latestResult?.[key]
      if (!value || value.status === 'NOT_ANALYZED') return { value: 'Not analyzed', tone: 'neutral' }
      if (value.status === 'DETECTED' && value.prediction !== clear) return { value: 'High', tone: 'high' }
      if (value.status === 'UNCERTAIN') return { value: 'Moderate', tone: 'moderate' }
      return { value: 'Low', tone: 'low' }
    }
    return {
      total: history.length,
      health: latestResult ? overallStatusLabel(latestResult.overall_status, t) : 'No crop scans yet',
      disease: risk('disease', 'healthy'),
      pest: risk('pest', 'no_pest'),
      tuta: risk('tuta', 'healthy')
    }
  }, [history, latestResult, t])

  return (
    <>
      <Header eyebrow="Crop health command center" title="Your Tomato Crop's AI Health Assistant" text="Verify the crop. Detect threats. Get an action plan." action={<button className="primary-button" onClick={() => navigate('/analyze')}><Camera size={18} /> Analyze my crop <ArrowRight size={16} /></button>} />
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="live-pill"><i className="status-dot" /> Detect early. Act smarter.</span>
          <h2>Protect every tomato.</h2>
          <p>One clear image moves through tomato validation, three specialist models, and a practical next step for the crop in front of you.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/analyze')}><ScanIcon size={17} /> Start AI scan</button>
            <button className="text-button" onClick={() => navigate('/how-ai-works')}>See how AI works <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1200&q=85" alt={t.leaf} />
          <div className="visual-tag">
            <Sprout size={17} />
            <span><b>Field-ready intelligence</b><small>TomatoGuard AI</small></span>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">Crop health overview</span><h2>Current field signal</h2></div>
        <span className="scan-count"><FileImage size={14} /> {stats.total} {stats.total === 1 ? 'scan' : 'scans'} stored locally</span>
      </div>

      <section className="stats metric-grid">
        <Stat icon={Activity} value={stats.health} label="Crop health" note={latestResult ? 'Based on latest AI analysis' : 'Start with an image scan'} tone="green" />
        <Stat icon={ShieldCheck} value={stats.disease.value} label="Disease risk" note={latestResult?.disease?.prediction ? label(latestResult.disease.prediction) : 'No crop scan yet'} tone={stats.disease.tone} />
        <Stat icon={BugIcon} value={stats.pest.value} label="Pest risk" note={latestResult?.pest?.prediction ? label(latestResult.pest.prediction) : 'No crop scan yet'} tone={stats.pest.tone} />
        <Stat icon={ButterflyIcon} value={stats.tuta.value} label="Tuta risk" note={latestResult?.tuta?.prediction ? label(latestResult.tuta.prediction) : 'No crop scan yet'} tone={stats.tuta.tone} />
      </section>
      {!latestResult && <div className="empty-prompt"><div><span className="eyebrow">Ready when you are</span><h3>No crop scans yet</h3><p>Upload a clear tomato leaf or plant image to create your first health report.</p></div><button className="secondary-button" onClick={() => navigate('/analyze')}>Start AI scan <ArrowRight size={16} /></button></div>}
    </>
  )
}

function Stat({ icon: Icon, value, label: title, note, tone = 'green' }) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-icon"><Icon size={18} /></div>
      <strong>{value}</strong>
      <b>{title}</b>
      <small>{note}</small>
    </div>
  )
}

function AnalyzePage() {
  const { t, file, preview, scanning, loadingStage, error, setError, choose, clearSelection, analyze, analysis } = useContext(LanguageContext)
  const input = useRef(null)
  const video = useRef(null)
  const canvas = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const result = analysis?.result

  useEffect(() => {
    const currentVideo = video.current
    if (!cameraStream || !currentVideo) return undefined

    currentVideo.srcObject = cameraStream
    currentVideo.play().catch(() => {})

    return () => {
      currentVideo.srcObject = null
    }
  }, [cameraStream])

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop())
  }, [cameraStream])

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop())
    setCameraStream(null)
    setCameraOpen(false)
  }

  const openCamera = async () => {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support camera access.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setCameraStream(stream)
      setCameraOpen(true)
    } catch (cameraError) {
      if (cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError') {
        setError('Camera permission was denied. Please allow camera access in your browser.')
      } else if (cameraError?.name === 'NotFoundError' || cameraError?.name === 'NotReadableError' || cameraError?.name === 'OverconstrainedError') {
        setError('Camera is not available on this device.')
      } else {
        setError('Camera is not available on this device.')
      }
    }
  }

  const capturePhoto = () => {
    const currentVideo = video.current
    const currentCanvas = canvas.current

    if (!currentVideo || !currentCanvas || !currentVideo.videoWidth || !currentVideo.videoHeight) {
      setError('Camera is not available on this device.')
      return
    }

    currentCanvas.width = currentVideo.videoWidth
    currentCanvas.height = currentVideo.videoHeight
    currentCanvas.getContext('2d').drawImage(currentVideo, 0, 0, currentCanvas.width, currentCanvas.height)
    currentCanvas.toBlob((blob) => {
      if (!blob) {
        setError('Camera is not available on this device.')
        return
      }

      choose(new File([blob], `tomatoguard-camera-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const resetUpload = () => {
    stopCamera()
    clearSelection()
    if (input.current) input.current.value = ''
  }

  const showValidationState = result?.overall_status === 'NON_TOMATO_IMAGE' || result?.overall_status === 'VALIDATION_UNCERTAIN'

  if (scanning) return <LoadingAnalysis loadingStage={loadingStage} />

  if (result && showValidationState) {
    return (
      <>
        <Header eyebrow="AI crop scanner" title="Validation needs another look" text={analysis.fileName} />
        <ValidationCard result={result} onReset={resetUpload} />
      </>
    )
  }

  if (result) {
    return (
      <>
        <ReportContent source={analysis} />
      </>
    )
  }

  return (
    <>
      <Header eyebrow={t.lab} title={t.analyzeTitle} text={t.analyzeText} />
      <div className="input-choice-grid">
        <motion.div className="input-choice-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <div className="choice-icon"><Camera size={28} /></div>
          <h3>{t.useCamera}</h3>
          <p>{t.cameraDescription}</p>
          <button className="primary-button" onClick={openCamera}><Camera size={17} /> {t.openCamera}</button>
        </motion.div>

        <motion.div className="input-choice-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <div className="choice-icon folder"><FolderOpen size={28} /></div>
          <h3>{t.browseFiles}</h3>
          <p>{t.browseDescription}</p>
          <button className="secondary-button" onClick={() => input.current?.click()}><UploadCloud size={17} /> {t.chooseImage}</button>
        </motion.div>
      </div>

      {file && (
        <div className="panel selected-image-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">{t.selectedImage}</span><h3>{file.name}</h3></div>
            <small>{t.fileSize}: {(file.size / 1024).toFixed(1)} KB</small>
          </div>

          <div className="selected-image-preview">
            <img src={preview} alt={t.selectedImage} />
          </div>

          <div className="selected-image-actions">
            <button className="secondary-button" onClick={openCamera}><Camera size={17} /> {t.retake}</button>
            <button className="icon-button danger" onClick={resetUpload} aria-label={t.remove}><Trash2 size={17} /></button>
            <button className="primary-button" onClick={analyze} disabled={scanning}><ScanSearch size={17} /> {t.analyzeCrop}</button>
          </div>
        </div>
      )}

      <input ref={input} type="file" accept="image/jpeg,image/jpg,image/png" hidden onChange={(event) => choose(event.target.files?.[0])} />
      <canvas ref={canvas} hidden />
      {cameraOpen && (
        <div className="camera-modal" role="dialog" aria-modal="true" aria-label="Camera">
          <div className="camera-panel panel">
            <div className="panel-heading">
              <div><span className="eyebrow">Live capture</span><h3>Frame your tomato crop</h3></div>
              <button className="icon-button" onClick={stopCamera} aria-label="Close Camera">×</button>
            </div>
            <div className="camera-frame">
              <video ref={video} autoPlay muted playsInline />
              <div className="camera-corners" />
              <span className="camera-live-dot">LIVE CAMERA</span>
            </div>
            <div className="camera-actions">
              <button className="secondary-button" onClick={stopCamera}>Close Camera</button>
              <button className="primary-button" onClick={capturePhoto}><Camera size={17} /> Capture Photo</button>
            </div>
          </div>
        </div>
      )}
      {error && <ErrorBanner message={error} />}
    </>
  )
}

function LoadingAnalysis({ loadingStage }) {
  const { t } = useContext(LanguageContext)
  const stages = [
    ['01', 'Checking image', FileImage],
    ['02', 'Verifying tomato', Leaf],
    ['03', 'Scanning diseases', Activity],
    ['04', 'Scanning pests', BugIcon],
    ['05', 'Checking Tuta absoluta', Target],
    ['06', 'Preparing action plan', ShieldCheck],
  ]
  return (
    <div className="scanner-loading">
      <div className="loading-intro">
        <div className="loading-orbit"><ScanSearch size={28} /></div>
        <div><span className="eyebrow">Live analysis pipeline</span><h2>{loadingStage || t.scanning}</h2><p>TomatoGuard is waiting for the complete backend report before showing results.</p></div>
      </div>
      <div className="pipeline-list">
        {stages.map(([number, title, Icon]) => <div className="pipeline-stage" key={number}><span>{number}</span><Icon size={17} /><strong>{title}</strong><i className="stage-pulse" /></div>)}
      </div>
      <div className="loading-track"><i /></div>
    </div>
  )
}

function Results() {
  const { t, analysis, history } = useContext(LanguageContext)
  const source = analysis || history[0]
  const navigate = useNavigate()

  if (!source) return <EmptyState title={t.noResults} text={t.noResultsText} action={t.start} onClick={() => navigate('/analyze')} />

  const result = source.result
  const status = result?.overall_status

  if (status === 'NON_TOMATO_IMAGE' || status === 'VALIDATION_UNCERTAIN') {
    return (
      <>
        <Header eyebrow="Tomato health report" title="Validation result" text={source.fileName} />
        <ValidationCard result={result} onReset={() => navigate('/analyze')} />
      </>
    )
  }

  return <ReportContent source={source} />
}

function ValidationCard({ result, onReset }) {
  const nonTomato = result?.overall_status === 'NON_TOMATO_IMAGE'
  const validation = result?.tomato_validation || {}
  const confidence = toPercent(validation.confidence)
  return (
    <section className={`validation-card ${nonTomato ? 'validation-negative' : 'validation-uncertain'}`}>
      <div className="validation-icon">{nonTomato ? <AlertTriangle size={28} /> : <Info size={28} />}</div>
      <div className="validation-content">
        <span className="eyebrow">Tomato validation</span>
        <h2>{nonTomato ? 'Not a tomato image' : 'Tomato verification uncertain'}</h2>
        <p>{validation.reason || (nonTomato ? 'This image does not appear to contain a tomato plant or tomato leaf.' : 'We could not confidently verify this as a tomato image.')}</p>
        {validation.confidence != null && <ConfidenceBar value={confidence} />}
        {validation.source && <span className="source-note"><CheckCircle2 size={14} /> {validation.source === 'GEMINI' ? 'Validated by Gemini Vision' : 'Validated by local fallback'}</span>}
        <button className="primary-button" onClick={onReset}><UploadCloud size={17} /> Upload another image</button>
      </div>
    </section>
  )
}

function ReportContent({ source }) {
  const { t } = useContext(LanguageContext)
  const navigate = useNavigate()
  const result = source?.result || {}
  const validation = result.tomato_validation || {}
  const confidence = toPercent(validation.confidence)
  const specialistResults = [
    ['Disease', 'disease', result.disease, Activity],
    ['Pest', 'pest', result.pest, BugIcon],
    ['Tuta absoluta', 'tuta', result.tuta, ButterflyIcon],
  ]
  return (
    <>
      <Header eyebrow="Tomato health report" title="Your crop, decoded." text={`${source.fileName} · ${new Date(source.createdAt).toLocaleString()}`} action={<button className="secondary-button" onClick={() => navigate('/analyze')}><RefreshCw size={16} /> New scan</button>} />
      <section className="report-header">
        <img src={source.imageUrl} alt={t.leaf} />
        <div className="report-summary">
          <span className="report-kicker"><CheckCircle2 size={15} /> Analysis complete</span>
          <h2>{overallStatusLabel(result.overall_status, t)}</h2>
          <p>{result.recommendations?.length ? `${result.recommendations.length} management guidance item${result.recommendations.length === 1 ? '' : 's'} prepared.` : 'No high-confidence issue was produced for this image.'}</p>
          <div className="validation-inline"><Leaf size={16} /><span><b>{validation.label === 'tomato' ? 'Tomato confirmed' : 'Tomato validation'}</b><small>{validation.source === 'GEMINI' ? 'Gemini Vision' : 'Local validation'} · {confidence}% confidence</small></span></div>
        </div>
        <button className="icon-button report-share" aria-label="View scan details"><Info size={17} /></button>
      </section>
      <section className="report-layout">
        <div>
          <div className="section-heading compact-heading"><div><span className="eyebrow">Specialist models</span><h2>Analysis findings</h2></div></div>
          <div className="result-grid">
            {specialistResults.map(([title, type, data, Icon]) => <PredictionCard key={type} title={title} type={type} icon={Icon} data={data} />)}
          </div>
        </div>
        <HealthScore result={result} />
      </section>
      <DecisionTrail result={result} />
      <div className="report-section-heading"><div><span className="eyebrow">Field guidance</span><h2>What should I do now?</h2></div><button className="text-button" onClick={() => navigate('/recommendations')}>Open action plan <ArrowRight size={16} /></button></div>
      {Array.isArray(result.recommendations) && result.recommendations.length > 0 ? <div className="recommendations">{result.recommendations.map((item, index) => <RecommendationCard key={`${item?.prediction || 'rec'}-${index}`} recommendation={item} />)}</div> : <div className="empty-prompt muted-panel"><div><h3>No action signals right now</h3><p>No strong recommendations were produced for this scan.</p></div></div>}
    </>
  )
}

function ConfidenceBar({ value }) {
  return <div className="confidence-bar"><div><span>Confidence</span><b>{Math.round(value)}%</b></div><i style={{ width: `${value}%` }} /></div>
}

function HealthScore({ result }) {
  const values = [result?.disease, result?.pest, result?.tuta].filter((item) => item && item.status !== 'NOT_ANALYZED')
  const usable = values.length > 0
  const issuePenalty = values.reduce((total, item) => total + (item.status === 'DETECTED' && !['healthy', 'no_pest'].includes(item.prediction) ? toPercent(item.confidence) : 0), 0)
  const score = usable ? Math.round(Math.max(0, 100 - issuePenalty / values.length)) : 0
  return <section className="health-score panel"><div className="section-heading compact-heading"><div><span className="eyebrow">Application indicator</span><h2>Crop health score</h2></div></div><div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}><span>{usable ? score : '—'}<small>{usable ? '/100' : 'Unavailable'}</small></span></div><p>Based on the current AI analysis. This is an application-level indicator, not an officially validated agricultural measurement.</p></section>
}

function DecisionTrail({ result }) {
  const hasSpecialist = ['disease', 'pest', 'tuta'].some((key) => result?.[key])
  const steps = [
    ['Image received', true],
    ['Tomato validation completed', Boolean(result?.tomato_validation)],
    ['Disease scan completed', hasSpecialist && Boolean(result?.disease)],
    ['Pest scan completed', hasSpecialist && Boolean(result?.pest)],
    ['Tuta scan completed', hasSpecialist && Boolean(result?.tuta)],
    ['Confidence thresholds evaluated', Boolean(result?.overall_status)],
    ['Management guidance prepared', Array.isArray(result?.recommendations)],
  ]
  return <section className="decision-trail panel"><div className="section-heading compact-heading"><div><span className="eyebrow">Explainable workflow</span><h2>AI decision trail</h2></div></div><div className="trail-grid">{steps.map(([step, complete]) => <div className={complete ? 'trail-step complete' : 'trail-step'} key={step}>{complete ? <Check size={15} /> : <Clock3 size={15} />}<span>{step}</span></div>)}</div><div className="model-strip"><span><b>Tomato validation</b>Gemini Vision</span><span><b>Disease model</b>EfficientNetB0</span><span><b>Pest model</b>EfficientNetB0</span><span><b>Tuta model</b>EfficientNetB0</span></div></section>
}

function Recommendations() {
  const { t, analysis, history } = useContext(LanguageContext)
  const navigate = useNavigate()
  const source = analysis || history[0]

  if (!source) return <EmptyState title={t.noRecs} text={t.noRecsText} action={t.start} onClick={() => navigate('/analyze')} />

  const recs = source.result?.recommendations || []

  return (
    <>
      <Header eyebrow={t.recommendations} title={t.recommendations} text={t.heroText} />
      {recs.length ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {recs.map((item, index) => (
            <RecommendationCard key={`${item?.prediction || 'rec'}-${index}`} recommendation={item} />
          ))}
        </div>
      ) : (
        <div className="empty"><CheckCircle2 size={30} /><h2>{t.noAction}</h2><p>{t.noActionText}</p></div>
      )}
    </>
  )
}

function Insights() {
  const { t, history } = useContext(LanguageContext)
  const navigate = useNavigate()
  const detections = history.reduce((total, item) => total + ['disease', 'pest', 'tuta'].filter((key) => item?.result?.[key]?.status === 'DETECTED').length, 0)
  const healthy = history.filter((item) => item?.result?.overall_status === 'NO_HIGH_CONFIDENCE_ISSUE').length
  return (
    <>
      <Header eyebrow="Crop health" title="Insights from your scans" text="A quiet view of what your own crop history is telling you." />
      {!history.length ? <EmptyState title="More scans needed to generate insights." text="Run a few crop scans and TomatoGuard will surface trends from your local history." action={t.start} onClick={() => navigate('/analyze')} /> : <>
        <section className="insight-metrics"><Stat icon={FileImage} value={history.length} label="Total scans" note="Stored locally" tone="green" /><Stat icon={AlertTriangle} value={detections} label="Detected signals" note="Across specialist models" tone="high" /><Stat icon={CheckCircle2} value={healthy} label="Healthy outcomes" note="No high-confidence issue" tone="low" /></section>
        <section className="insight-grid"><div className="panel chart-panel"><div className="section-heading compact-heading"><div><span className="eyebrow">Recent detections</span><h2>What has appeared</h2></div><BarChart3 size={20} /></div>{history.slice(0, 8).map((item) => <div className="insight-row" key={item.id}><span>{new Date(item.createdAt).toLocaleDateString()}</span><strong>{overallStatusLabel(item.result?.overall_status, t)}</strong><small>{item.fileName}</small></div>)}</div><div className="panel insight-note"><Info size={21} /><h3>Read the signal, then verify in the field.</h3><p>These insights are summaries of your saved AI analyses. They do not replace crop walks, expert advice, or local growing knowledge.</p></div></section>
      </>}
    </>
  )
}

function HistoryPage() {
  const { t, history, setHistory, setAnalysis, analysis } = useContext(LanguageContext)
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState(null)

  const removeRecord = (id) => {
    setHistory((old) => {
      const next = normalizeHistory(old).filter((item) => item.id !== id)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
    if (analysis?.id === id) setAnalysis(null)
    setDeleteId(null)
  }

  return (
    <>
      <Header eyebrow="Crop timeline" title="Your crop timeline" text="Every scan, kept close to the field and easy to revisit." />

      {deleteId && (
        <DeleteDialog
          title={t.deleteConfirm}
          text={t.deleteConfirmText}
          onCancel={() => setDeleteId(null)}
          onDelete={() => removeRecord(deleteId)}
          t={t}
        />
      )}

      {history.length ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {history.map((record) => (
            <HistoryCard key={record.id} record={record} onDelete={() => setDeleteId(record.id)} onView={() => { setAnalysis(record); navigate('/results') }} />
          ))}
        </div>
      ) : (
        <EmptyState title={t.emptyHistory} text={t.emptyHistoryText} action={t.start} onClick={() => navigate('/analyze')} />
      )}
    </>
  )
}

function HistoryCard({ record, onDelete, onView }) {
  const { t } = useContext(LanguageContext)
  const result = record.result || {}
  const statusText = overallStatusLabel(result.overall_status, t)

  return (
    <div className="panel history-row">
      <img src={record.imageUrl} alt={record.fileName} />
      <div className="history-body">
        <div className="history-top">
          <div>
            <div className="eyebrow">{t.date}</div>
            <strong>{new Date(record.createdAt).toLocaleString()}</strong>
          </div>
          <span className="status detected">{statusText}</span>
        </div>

        <div className="history-meta">
          <MetaChip label="Disease" value={label(result?.disease?.prediction || 'unknown')} />
          <MetaChip label="Pest" value={label(result?.pest?.prediction || 'unknown')} />
          <MetaChip label="Tuta" value={label(result?.tuta?.prediction || 'unknown')} />
          <MetaChip label="Confidence" value={`${Math.max(toPercent(result?.disease?.confidence), toPercent(result?.pest?.confidence), toPercent(result?.tuta?.confidence))}%`} />
        </div>

        <div className="history-actions">
          <button className="secondary-button" onClick={onView}>{t.viewDetails}</button>
          <button className="icon-button danger" onClick={onDelete} aria-label={t.delete}><Trash2 size={17} /></button>
        </div>
      </div>
    </div>
  )
}

function MetaChip({ label, value }) {
  return (
    <div className="meta-chip">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function DeleteDialog({ title, text, onCancel, onDelete, t }) {
  return (
    <div className="modal-backdrop">
      <div className="panel modal-card">
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>{t.cancel}</button>
          <button className="primary-button" onClick={onDelete}>{t.delete}</button>
        </div>
      </div>
    </div>
  )
}

function PredictionCard({ title, data, icon: Icon = Activity }) {
  const { t } = useContext(LanguageContext)
  const confidence = toPercent(data?.confidence)
  const detected = data?.status === 'DETECTED'
  const notAnalyzed = !data || data.status === 'NOT_ANALYZED'

  return (
    <div className={`panel prediction-card ${notAnalyzed ? 'not-analyzed' : ''}`}>
      <div className="prediction-header">
        <h3><Icon size={18} /> {title}</h3>
        <span className={`status ${detected ? 'detected' : notAnalyzed ? 'neutral' : 'uncertain'}`}>{notAnalyzed ? 'Not analyzed' : detected ? t.detected : t.uncertain}</span>
      </div>

      <div className="confidence-row">
        <div className="ring" style={{ background: `conic-gradient(#287252 0 ${confidence}%, #edf0ef ${confidence}% 100%)` }}>
          <span>{Math.round(confidence)}%</span>
        </div>

        <div className="confidence-copy">
          <small>{t.prediction}</small>
          <h4>{notAnalyzed ? 'Not analyzed' : label(data?.prediction || 'unknown')}</h4>
          <p>{confidence}% {t.confidence}</p>
        </div>
      </div>

      <div className="progress-bar">
        <i style={{ width: `${confidence}%` }} />
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation }) {
  if (!recommendation || !recommendation.recommendation) return null

  const values = recommendation.recommendation
  const listValue = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return [value]
    return ['No information available.']
  }

  return (
    <div className="panel recommendation-card">
      <div className="recommendation-header">
        <span>{recommendation.type || 'Issue'}</span>
        <h3>{values.condition || label(recommendation.prediction || 'unknown')}</h3>
      </div>

      <div className="recommendation-grid">
        <InfoBlock title="Symptoms" value={values.symptoms || 'No symptom details available.'} />
        <InfoBlock title="Immediate actions" value={listValue(values.immediate_actions)} />
        <InfoBlock title="Management" value={listValue(values.management)} />
        <InfoBlock title="Prevention" value={listValue(values.prevention)} />
        <InfoBlock title="Monitoring" value={listValue(values.monitoring)} />
        <InfoBlock title="Biological control" value={listValue(values.biological_control)} />
        <InfoBlock title="Chemical guidance" value={listValue(values.chemical_guidance)} />
        <InfoBlock title="Expert help" value={listValue(values.expert_help)} />
      </div>
    </div>
  )
}

function InfoBlock({ title, value }) {
  return (
    <div className="info-block">
      <strong>{title}</strong>
      {Array.isArray(value) ? value.map((item) => <div key={item}>• {item}</div>) : <div>{value}</div>}
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div className="panel error-banner">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <AlertTriangle size={18} />
        <div>
          <strong>Unable to connect to TomatoGuard AI.</strong>
          <div>{message}</div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, text, action, onClick }) {
  return (
    <div className="empty panel center-panel">
      <Search size={30} />
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary-button" onClick={onClick}><ScanIcon size={17} /> {action}</button>
    </div>
  )
}

function HowAIWorks() {
  const steps = [
    ['Image', 'Your uploaded crop image enters the pipeline.', FileImage],
    ['Tomato validation', 'Gemini Vision checks whether the image contains tomato.', Leaf],
    ['Disease classification', 'EfficientNetB0 evaluates disease classes at the configured threshold.', Activity],
    ['Pest classification', 'EfficientNetB0 checks the specialist pest classes.', BugIcon],
    ['Tuta detection', 'EfficientNetB0 checks for Tuta absoluta signals.', ButterflyIcon],
    ['Confidence check', 'The backend keeps uncertain results visible instead of overstating them.', ShieldCheck],
    ['Recommendation engine', 'Existing recommendation data becomes a practical action plan.', Sprout],
  ]
  return (
    <>
      <Header eyebrow="System map" title="How TomatoGuard thinks" text="A transparent path from image to crop guidance, with the backend remaining the source of truth." />
      <section className="architecture-flow"><div className="flow-node"><FileImage size={18} /><span>IMAGE</span></div><div className="flow-arrow">↓</div><div className="flow-node accent"><Leaf size={18} /><span>TOMATO VALIDATION</span></div><div className="flow-arrow">↓</div><div className="flow-branches"><div><BugIcon size={18} /><span>DISEASE</span></div><div><BugIcon size={18} /><span>PEST</span></div><div><ButterflyIcon size={18} /><span>TUTA</span></div></div><div className="flow-arrow">↓</div><div className="flow-node"><ShieldCheck size={18} /><span>CONFIDENCE CHECK</span></div><div className="flow-arrow">↓</div><div className="flow-node accent"><Sprout size={18} /><span>ACTION PLAN</span></div></section>
      <div className="how-grid">
        {steps.map(([step, description, Icon], index) => (
          <div className="panel how-card" key={step}>
            <div className="how-number">{String(index + 1).padStart(2, '0')}</div><Icon size={20} />
            <h3>{step}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function ScanIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 12h8M12 8v8" />
    </svg>
  )
}

function overallStatusLabel(value) {
  if (value === 'NON_TOMATO_IMAGE') return 'Non-Tomato'
  if (value === 'VALIDATION_UNCERTAIN') return 'Validation Uncertain'
  if (value === 'ISSUE_DETECTED') return 'Issue Detected'
  if (value === 'NO_HIGH_CONFIDENCE_ISSUE') return 'No High Confidence Issue'
  return 'Analysis Complete'
}

export default App
