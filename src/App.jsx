import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import mermaid from 'mermaid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import {
    Menu, X, BookOpen, ChevronRight, Search,
    Share2, CornerUpRight, ZoomIn, ZoomOut, Maximize2, RefreshCw
} from 'lucide-react'

import chaptersData from './data/chapters.json'

// --- Mermaid Configuration ---
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, Noto Serif SC',
    flowchart: {
        curve: 'basis',
        padding: 30,
        useMaxWidth: false, // Important for zoom to have natural size
    },
    themeVariables: {
        primaryColor: '#c3a343',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#c3a343',
        lineColor: '#c3a343',
        nodeBorder: '#c3a343',
        mainBkg: 'rgba(26, 42, 68, 0.6)',
        nodeTextColor: '#e2e8f0',
        edgeLabelBackground: 'rgba(5, 7, 10, 0.95)',
        clusterBkg: 'rgba(255, 255, 255, 0.05)',
    }
})

// --- Sub-Components ---

const MermaidDiagram = React.memo(({ chart, id }) => {
    const ref = useRef(null)

    useEffect(() => {
        const render = async () => {
            if (ref.current && chart) {
                try {
                    ref.current.innerHTML = ''
                    const { svg } = await mermaid.render(`mermaid-${id}-${Date.now()}`, chart)
                    ref.current.innerHTML = svg
                } catch (e) {
                    console.error('Mermaid Render Error:', e)
                    ref.current.innerHTML = '<div class="text-dim">Diagram rendering failed</div>'
                }
            }
        }
        render()
    }, [chart, id])

    return (
        <div className="diagram-wrapper">
            <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={4}
                centerOnInit={true}
                limitToBounds={false}
            >
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                    <>
                        <div className="diagram-controls">
                            <button onClick={() => zoomIn()} className="control-btn" title="放大"><ZoomIn size={16} /></button>
                            <button onClick={() => zoomOut()} className="control-btn" title="缩小"><ZoomOut size={16} /></button>
                            <button onClick={() => resetTransform()} className="control-btn" title="重置"><RefreshCw size={16} /></button>
                            <button onClick={() => centerView()} className="control-btn" title="居中"><Maximize2 size={16} /></button>
                        </div>
                        <TransformComponent wrapperStyle={{ width: '100%', height: 'auto', minHeight: '400px', maxHeight: '85vh', cursor: 'grab' }}>
                            <div
                                ref={ref}
                                className="mermaid-container"
                                style={{ padding: '3rem', minWidth: '100%' }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    )
})

const SidebarLink = ({ chapter, isActive, onClick }) => (
    <button
        className={`nav-link ${isActive ? 'active' : ''}`}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
    >
        <span className="chapter-num-badge" style={{ marginRight: '12px' }}>
            {String(chapter.chapter_num).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chapter.title.split('：')[0]}
        </span>
        <ChevronRight size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
    </button>
)

// --- Main App ---

export default function App() {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [search, setSearch] = useState('')

    const activeChapter = chaptersData[currentIdx]

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return chaptersData
        return chaptersData.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.chapter_num.toString().includes(q) ||
            (c.interest_table && c.interest_table.toLowerCase().includes(q))
        )
    }, [search])

    const handleSelect = useCallback((idx) => {
        setCurrentIdx(idx)
        setSidebarOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url).then(() => {
            alert('项目链接已复制到剪贴板！')
        })
    }

    return (
        <div className="app-layout">
            {/* Top Navigation */}
            <header className="top-nav">
                <button
                    className="icon-btn menu-toggle"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
                <div style={{ marginLeft: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>西游图谱</h2>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn" title="Share" onClick={handleShare}><Share2 size={18} /></button>
                </div>
            </header>

            {/* Sidebar Drawer */}
            <div
                className={`overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />
            <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>章节目录</h3>
                    <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(false)} style={{ border: 'none', background: 'transparent' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="search-wrapper">
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
                        <input
                            className="search-field"
                            placeholder="寻找章节或内容..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <nav className="nav-scroll">
                    {filtered.map(chapter => {
                        const originalIndex = chaptersData.findIndex(c => c.chapter_num === chapter.chapter_num)
                        return (
                            <SidebarLink
                                key={chapter.chapter_num}
                                chapter={chapter}
                                isActive={currentIdx === originalIndex}
                                onClick={() => handleSelect(originalIndex)}
                            />
                        )
                    })}
                </nav>
            </aside>

            {/* Content Area */}
            <main className="main-wrapper">
                <div className="chapter-container">
                    <AnimatePresence mode="wait">
                        <motion.article
                            key={activeChapter.chapter_num}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <header className="title-section">
                                <span className="chapter-number">Chapter {activeChapter.chapter_num}</span>
                                <h1 className="chapter-title">{activeChapter.title}</h1>
                            </header>

                            <div className="v-stack gap-8">
                                <div className="diagrams-grid">
                                    {activeChapter.mermaid_diagrams.map((chart, i) => (
                                        <section key={i} className="diagram-card">
                                            <h3 className="card-title">
                                                <BookOpen size={20} />
                                                {i === 0 ? '架构图谱' : '流程解析'}
                                            </h3>
                                            <MermaidDiagram chart={chart} id={`ch-${activeChapter.chapter_num}-d-${i}`} />
                                        </section>
                                    ))}
                                </div>

                                {activeChapter.interest_table && (
                                    <section className="diagram-card">
                                        <h3 className="card-title">
                                            <CornerUpRight size={20} />
                                            利益博弈分析
                                        </h3>
                                        <div className="table-container">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {activeChapter.interest_table}
                                            </ReactMarkdown>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </motion.article>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
