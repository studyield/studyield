import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Globe,
  BookOpen,
  Copy,
  Check,
  Download,
  Trash2,
  Share2,
  ExternalLink,
  List,
} from 'lucide-react';
import { researchService } from '@/services/research';
import type { ResearchSession, ResearchSource } from '@/services/research';

type Tab = 'report' | 'sources' | 'export';

export function ResearchReportPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('report');
  const [copied, setCopied] = useState(false);
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [includeSections, setIncludeSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    researchService.get(id)
      .then((data) => {
        setSession(data);
        // Initialize all sections as included
        if (data.outline?.sections) {
          const initial: Record<string, boolean> = {};
          data.outline.sections.forEach((_s, i) => {
            initial[`section-${i}`] = true;
          });
          setIncludeSections(initial);
        }
      })
      .catch(() => navigate('/dashboard/research'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await researchService.delete(id);
      navigate('/dashboard/research');
    } catch {
      // Silently ignore delete errors
    }
  };

  const handleCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!session) return;
    const outline = session.outline;
    let md = `# ${outline?.title || session.query}\n\n`;

    if (outline?.executiveSummary) {
      md += `## Executive Summary\n\n${outline.executiveSummary}\n\n`;
    }

    if (outline?.sections) {
      outline.sections.forEach((sec, i) => {
        if (!includeSections[`section-${i}`]) return;
        md += `## ${sec.heading}\n\n${sec.content}\n\n`;
        if (sec.keyPoints.length > 0) {
          md += `### Key Points\n\n${sec.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
        }
      });
    }

    if (session.sources.length > 0) {
      md += `## Sources\n\n`;
      session.sources.forEach((s, i) => {
        md += `[${i + 1}] ${s.title}${s.url ? ` - ${s.url}` : ''}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${session.query.slice(0, 30).replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const formatCitation = (source: ResearchSource, index: number) => {
    const now = new Date();
    const year = now.getFullYear();
    if (citationStyle === 'apa') {
      return `[${index + 1}] ${source.title}. (${year}).${source.url ? ` Retrieved from ${source.url}` : ''}`;
    }
    if (citationStyle === 'mla') {
      return `[${index + 1}] "${source.title}."${source.url ? ` ${source.url}.` : ''} Accessed ${now.toLocaleDateString()}.`;
    }
    return `[${index + 1}] "${source.title},"${source.url ? ` ${source.url},` : ''} accessed ${now.toLocaleDateString()}.`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) return null;

  const outline = session.outline;
  const kbSources = session.sources.filter((s) => s.type === 'knowledge_base');
  const webSources = session.sources.filter((s) => s.type === 'web');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/research')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('researchReport.back')}
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{outline?.title || session.query}</h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{session.query}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyText(session.synthesis || '')}
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
              {copied ? t('researchReport.copied') : t('researchReport.share')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6"
        >
          {[
            { key: 'report' as const, label: t('researchReport.report'), icon: FileText },
            { key: 'sources' as const, label: t('researchReport.sourcesTab', { count: session.sources.length }), icon: List },
            { key: 'export' as const, label: t('researchReport.exportTab'), icon: Download },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Report Tab */}
        {activeTab === 'report' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-6"
          >
            {/* Table of Contents Sidebar */}
            {outline && outline.sections.length > 2 && (
              <div className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-24 bg-card rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">{t('researchReport.contents')}</p>
                  <nav className="space-y-1">
                    {outline.executiveSummary && (
                      <a
                        href="#executive-summary"
                        className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        {t('researchReport.executiveSummary')}
                      </a>
                    )}
                    {outline.sections.map((sec, i) => (
                      <a
                        key={i}
                        href={`#section-${i}`}
                        className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1 truncate"
                      >
                        {sec.heading}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* Report Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Executive Summary */}
              {outline?.executiveSummary && (
                <div id="executive-summary" className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-lg font-bold mb-3">{t('researchReport.executiveSummary')}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {outline.executiveSummary}
                  </p>
                </div>
              )}

              {/* Sections */}
              {outline?.sections.map((sec, i) => (
                <div key={i} id={`section-${i}`} className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-lg font-bold mb-3">{sec.heading}</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {sec.content}
                  </div>
                  {sec.keyPoints.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t('researchReport.keyPoints')}</p>
                      <ul className="space-y-1">
                        {sec.keyPoints.map((point, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sec.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {sec.sources.map((srcIdx) => (
                        <span key={srcIdx} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-xs font-mono">
                          [{srcIdx}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Fallback: plain synthesis if no outline */}
              {!outline && session.synthesis && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {session.synthesis}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Knowledge Base Sources */}
            {kbSources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold">{t('researchReport.knowledgeBase', { count: kbSources.length })}</h3>
                </div>
                <div className="space-y-3">
                  {kbSources.map((source, i) => (
                    <SourceCard
                      key={i}
                      source={source}
                      index={session.sources.indexOf(source)}
                      onCopy={handleCopyText}
                      citationStyle={citationStyle}
                      formatCitation={formatCitation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Web Sources */}
            {webSources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold">{t('researchReport.webSources', { count: webSources.length })}</h3>
                </div>
                <div className="space-y-3">
                  {webSources.map((source, i) => (
                    <SourceCard
                      key={i}
                      source={source}
                      index={session.sources.indexOf(source)}
                      onCopy={handleCopyText}
                      citationStyle={citationStyle}
                      formatCitation={formatCitation}
                    />
                  ))}
                </div>
              </div>
            )}

            {session.sources.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('researchReport.noSourcesFound')}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Format Selection */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">{t('researchReport.exportFormat')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" onClick={handleExportPdf} className="h-auto py-4 flex-col gap-2">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">{t('researchReport.pdfPrint')}</span>
                </Button>
                <Button variant="outline" onClick={handleExportMarkdown} className="h-auto py-4 flex-col gap-2">
                  <Download className="w-5 h-5" />
                  <span className="text-sm">{t('researchReport.markdown')}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyText(session.synthesis || '')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Copy className="w-5 h-5" />
                  <span className="text-sm">{t('researchReport.copyText')}</span>
                </Button>
              </div>
            </div>

            {/* Citation Style */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">{t('researchReport.citationStyle')}</h3>
              <div className="flex gap-3">
                {(['apa', 'mla', 'chicago'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCitationStyle(style)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all uppercase ${
                      citationStyle === style
                        ? 'border-green-500/50 bg-green-500/5 text-green-600'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              {session.sources.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">{t('researchReport.preview')}</p>
                  <p className="text-xs font-mono">{formatCitation(session.sources[0], 0)}</p>
                </div>
              )}
            </div>

            {/* Section Include/Exclude */}
            {outline && outline.sections.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold mb-4">{t('researchReport.includeSections')}</h3>
                <div className="space-y-2">
                  {outline.sections.map((sec, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={includeSections[`section-${i}`] !== false}
                        onChange={(e) =>
                          setIncludeSections((prev) => ({
                            ...prev,
                            [`section-${i}`]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-border text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm">{sec.heading}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SourceCard({
  source,
  index,
  onCopy,
  formatCitation,
}: {
  source: ResearchSource;
  index: number;
  onCopy: (text: string) => void;
  citationStyle: string;
  formatCitation: (source: ResearchSource, index: number) => string;
}) {
  const { t } = useTranslation();
  const [copiedCitation, setCopiedCitation] = useState(false);

  const handleCopyCitation = () => {
    onCopy(formatCitation(source, index));
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-xs font-mono shrink-0">
          [{index + 1}]
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{source.title}</p>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
            >
              {source.url.length > 60 ? source.url.slice(0, 60) + '...' : source.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{source.content}</p>

          {/* Relevance Score Bar */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{t('researchReport.relevance')}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full max-w-32">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${source.relevanceScore * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(source.relevanceScore * 100)}%
            </span>
          </div>
        </div>
        <button
          onClick={handleCopyCitation}
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={t('researchReport.copyCitation')}
        >
          {copiedCitation ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default ResearchReportPage;
