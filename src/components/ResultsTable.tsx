import { useState } from 'react';
import { Download, ExternalLink, Eye, Heart, MessageCircle, Share2, ArrowUp, ArrowDown, ChevronsUpDown, Calendar, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultsTableProps {
  results: any[];
  jobId: string | null;
  highlightedVideoId?: string | null;
  onVideoHighlight?: (videoId: string | null) => void;
}

type SortField = 'likes' | 'views' | 'comments' | 'shares' | 'author' | 'text' | 'date';
type SortDirection = 'asc' | 'desc' | null;

export function ResultsTable({ results, jobId, highlightedVideoId, onVideoHighlight }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3 h-3 text-gray-500" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 text-pink-400" />;
    }
    return <ArrowDown className="w-3 h-3 text-pink-400" />;
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'likes':
        aVal = a.diggCount || a.stats?.diggCount || 0;
        bVal = b.diggCount || b.stats?.diggCount || 0;
        break;
      case 'views':
        aVal = a.playCount || a.stats?.playCount || 0;
        bVal = b.playCount || b.stats?.playCount || 0;
        break;
      case 'comments':
        aVal = a.commentCount || a.stats?.commentCount || 0;
        bVal = b.commentCount || b.stats?.commentCount || 0;
        break;
      case 'shares':
        aVal = a.shareCount || a.stats?.shareCount || 0;
        bVal = b.shareCount || b.stats?.shareCount || 0;
        break;
      case 'author':
        aVal = (a.authorMeta?.name || a.author?.uniqueId || '').toLowerCase();
        bVal = (b.authorMeta?.name || b.author?.uniqueId || '').toLowerCase();
        break;
      case 'text':
        aVal = (a.text || '').toLowerCase();
        bVal = (b.text || '').toLowerCase();
        break;
      case 'date':
        aVal = a.createTime || a.createTimeISO || 0;
        bVal = b.createTime || b.createTimeISO || 0;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return 'Brak daty';
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('TikTok Audyt - Raport', 14, 20);

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data generowania: ${new Date().toLocaleDateString('pl-PL')}`, 14, 28);
    doc.text(`Liczba filmow: ${sortedResults.length}`, 14, 34);

    // Calculate totals
    const totalViews = sortedResults.reduce((sum, item) => sum + (item.playCount || item.stats?.playCount || 0), 0);
    const totalLikes = sortedResults.reduce((sum, item) => sum + (item.diggCount || item.stats?.diggCount || 0), 0);
    const totalComments = sortedResults.reduce((sum, item) => sum + (item.commentCount || item.stats?.commentCount || 0), 0);

    doc.text(`Laczne wyswietlenia: ${formatNumber(totalViews)} | Polubienia: ${formatNumber(totalLikes)} | Komentarze: ${formatNumber(totalComments)}`, 14, 40);

    // Table data
    const tableData = sortedResults.map(item => [
      '@' + (item.authorMeta?.name || item.author?.uniqueId || 'Nieznany'),
      (item.text || 'Brak opisu').substring(0, 60) + ((item.text || '').length > 60 ? '...' : ''),
      formatNumber(item.diggCount || item.stats?.diggCount || 0),
      formatNumber(item.playCount || item.stats?.playCount || 0),
      formatNumber(item.commentCount || item.stats?.commentCount || 0),
      formatNumber(item.shareCount || item.stats?.shareCount || 0),
      formatDate(item.createTime || item.createTimeISO)
    ]);

    // Generate table
    autoTable(doc, {
      head: [['Autor', 'Opis', 'Polubienia', 'Wyswietlenia', 'Komentarze', 'Udostepnienia', 'Data']],
      body: tableData,
      startY: 48,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [236, 72, 153], // pink-500
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 35, halign: 'center' },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Strona ${i} z ${pageCount} | Wygenerowano przez TikTok Audyt`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`tiktok-audyt-${jobId || Date.now()}.pdf`);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(sortedResults, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tiktok-audyt-${jobId || Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Wyniki</h2>
          <p className="text-sm text-gray-400">
            {sortedResults.length} {sortedResults.length === 1 ? 'film' : 'filmów'} znaleziono
            {sortField && <span className="ml-2 text-gray-500">(posortowane)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-850 border-b border-gray-800">
            <tr>
              <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Wideo
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('author')}
              >
                <div className="flex items-center gap-1">
                  Autor
                  {getSortIcon('author')}
                </div>
              </th>
              <th
                className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('text')}
              >
                <div className="flex items-center gap-1">
                  Opis
                  {getSortIcon('text')}
                </div>
              </th>
              <th
                className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('likes')}
                title="Lubię to"
              >
                <div className="flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4" />
                  {getSortIcon('likes')}
                </div>
              </th>
              <th
                className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('views')}
                title="Wyświetlenia filmu"
              >
                <div className="flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4" />
                  {getSortIcon('views')}
                </div>
              </th>
              <th
                className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('comments')}
                title="Komentarze do filmu"
              >
                <div className="flex items-center justify-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {getSortIcon('comments')}
                </div>
              </th>
              <th
                className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('shares')}
                title="Udostępnienia"
              >
                <div className="flex items-center justify-center gap-1">
                  <Share2 className="w-4 h-4" />
                  {getSortIcon('shares')}
                </div>
              </th>
              <th
                className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('date')}
                title="Data publikacji"
              >
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {getSortIcon('date')}
                </div>
              </th>
              <th className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Link
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedResults.map((item, index) => {
              const likes = item.diggCount || item.stats?.diggCount || 0;
              const views = item.playCount || item.stats?.playCount || 0;
              const comments = item.commentCount || item.stats?.commentCount || 0;
              const shares = item.shareCount || item.stats?.shareCount || 0;
              const thumbnail = item.covers?.default || item.videoMeta?.coverUrl || '';
              const author = item.authorMeta?.name || item.author?.uniqueId || 'Nieznany';
              const videoUrl = item.webVideoUrl || item.shareUrl || '';

              return (
                <tr 
                  key={item.id || index} 
                  className={`hover:bg-gray-850 transition-colors ${
                    highlightedVideoId === (item.id || item.videoId) 
                      ? 'bg-blue-900/30 border border-blue-500/50' 
                      : ''
                  }`}
                  ref={highlightedVideoId === (item.id || item.videoId) ? (el: HTMLTableRowElement) => {
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  } : null}
                >
                  <td className="p-4">
                    {thumbnail && videoUrl ? (
                      <div className="relative group">
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          title="Zobacz wideo na TikTok"
                        >
                          <img
                            src={thumbnail}
                            alt="Miniaturka"
                            className="w-20 h-28 object-cover rounded-lg border-2 border-gray-700 group-hover:border-pink-500 shadow-lg group-hover:shadow-pink-500/50 transition-all duration-300"
                          />
                          {/* TikTok logo overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-lg transition-all duration-300">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                              </svg>
                            </div>
                          </div>
                        </a>
                      </div>
                    ) : thumbnail ? (
                      <img
                        src={thumbnail}
                        alt="Miniaturka"
                        className="w-20 h-28 object-cover rounded-lg border-2 border-gray-700 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-800 rounded-lg border-2 border-gray-700 flex items-center justify-center">
                        <Eye className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-300 font-medium">@{author}</span>
                  </td>
                  <td className="p-4 max-w-xs">
                    {videoUrl ? (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-pink-400 line-clamp-3 transition-colors cursor-pointer"
                      >
                        {item.text || 'Brak opisu'}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {item.text || 'Brak opisu'}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-center" title="Lubię to">
                    <span className="text-sm font-medium text-pink-400">
                      {formatNumber(likes)}
                    </span>
                  </td>
                  <td className="p-4 text-center" title="Wyświetlenia filmu">
                    <span className="text-sm font-medium text-blue-400">
                      {formatNumber(views)}
                    </span>
                  </td>
                  <td className="p-4 text-center" title="Komentarze do filmu">
                    <span className="text-sm font-medium text-green-400">
                      {formatNumber(comments)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-medium text-purple-400">
                      {formatNumber(shares)}
                    </span>
                  </td>
                  <td className="p-4 text-center" title="Data publikacji">
                    <span className="text-sm text-gray-400">
                      {formatDate(item.createTime || item.createTimeISO)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {videoUrl && (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Otwórz wideo na TikTok"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
