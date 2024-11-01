import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import ProgressBar from '../components/ProgressBar';
import ReportModal from '../components/ReportModal';
import { DataRecord } from '../types';
import { supabase } from '../utils/supabase';

const LOGO_URL = 'https://vatalot.com/wp-content/uploads/2024/09/Vatalot-transparent-2022-Dark.png';

type ReportType = 'full' | 'top100amount' | 'top100vat' | 'verified';

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  processData: (data: DataRecord[]) => DataRecord[];
}

export default function Reports() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentData, setCurrentData] = useState<DataRecord[]>([]);
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const reportOptions: ReportOption[] = [
    {
      id: 'full',
      title: t('reports.options.full'),
      description: t('reports.options.fullDesc'),
      processData: (data) => data
    },
    {
      id: 'top100amount',
      title: t('reports.options.top100amount'),
      description: t('reports.options.top100amountDesc'),
      processData: (data) => [...data]
        .sort((a, b) => Number(b.Amount || b.amount) - Number(a.Amount || a.amount))
        .slice(0, 100)
    },
    {
      id: 'top100vat',
      title: t('reports.options.top100vat'),
      description: t('reports.options.top100vatDesc'),
      processData: (data) => [...data]
        .sort((a, b) => Number(b.VAT || b.vat) - Number(a.VAT || a.vat))
        .slice(0, 100)
    },
    {
      id: 'verified',
      title: t('reports.options.verified'),
      description: t('reports.options.verifiedDesc'),
      processData: (data) => data.filter(record => 
        record.Verified === '0' || record.Verified === '1' ||
        record.verified === '0' || record.verified === '1'
      )
    }
  ];

  React.useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Load current data
        const { data: currentDataResult, error: currentDataError } = await supabase
          .from('data')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (currentDataError) throw currentDataError;

        // Load data history
        const { data: historyResult, error: historyError } = await supabase
          .from('data_imports')
          .select('*')
          .eq('user_id', user.id)
          .order('imported_at', { ascending: false });

        if (historyError) throw historyError;

        setCurrentData(currentDataResult || []);
        setDataHistory(historyResult || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, t]);

  const generatePDF = async (data: DataRecord[], title: string) => {
    if (!data || data.length === 0) {
      toast.error(t('reports.noData'));
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add logo
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const imgWidth = 50;
              const imgHeight = (img.height * imgWidth) / img.width;
              doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
              resolve();
            } catch (error) {
              console.warn('Logo rendering error:', error);
              resolve();
            }
          };
          img.onerror = () => {
            console.warn('Logo loading failed');
            resolve();
          };
          img.src = LOGO_URL;
        });
      } catch (logoError) {
        console.warn('Logo processing error:', logoError);
      }

      // Add title and metadata
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text(title, pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`${t('reports.generatedBy')}: ${user?.firstName} ${user?.lastName}`, 10, 35);
      doc.text(`${t('reports.date')}: ${new Date().toLocaleString()}`, 10, 40);

      // Prepare table data
      const headers = Object.keys(data[0]).filter(key => 
        !['id', 'created_at', 'updated_at', 'created_by', 'import_id'].includes(key)
      );

      const tableData = data.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('vat')) {
            return value ? new Intl.NumberFormat('en-ZA', {
              style: 'currency',
              currency: 'ZAR'
            }).format(Number(value)) : '';
          }
          return value !== null && value !== undefined ? String(value) : '';
        })
      );

      // Calculate progress steps
      const totalRows = data.length;
      const rowsPerPage = 25;
      const totalPages = Math.ceil(totalRows / rowsPerPage);
      let currentPage = 0;

      // Generate table with progress tracking
      await new Promise<void>((resolve, reject) => {
        try {
          autoTable(doc, {
            head: [headers.map(h => t(`data.columns.${h.toLowerCase()}`))],
            body: tableData,
            startY: 45,
            theme: 'grid',
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: {
              fillColor: [33, 72, 102],
              textColor: 255,
              fontSize: 9,
              fontStyle: 'bold'
            },
            didDrawPage: () => {
              currentPage++;
              const progressValue = Math.min(Math.round((currentPage / totalPages) * 100), 100);
              setProgress(progressValue);
            },
            margin: { top: 45 },
            columnStyles: headers.reduce((acc, _, index) => ({
              ...acc,
              [index]: { cellWidth: 'auto' }
            }), {})
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Save the PDF
      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success(t('reports.generated'));
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('reports.error'));
    } finally {
      setGenerating(false);
      setProgress(0);
      setShowReportModal(false);
      setSelectedImport(null);
    }
  };

  const handleGenerateReport = async (reportType: ReportType) => {
    const reportOption = reportOptions.find(option => option.id === reportType);
    if (!reportOption) return;

    const data = selectedImport ? selectedImport.data : currentData;
    const processedData = reportOption.processData(data);
    const title = selectedImport 
      ? `${reportOption.title} - ${selectedImport.filename}`
      : reportOption.title;
    
    await generatePDF(processedData, title);
  };

  const handleReportClick = (importData?: any) => {
    setSelectedImport(importData || null);
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('reports.currentData')}
          </h2>
          <button
            onClick={() => handleReportClick()}
            disabled={generating || !currentData || currentData.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {t('reports.generate')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('reports.historicalData')}
          </h2>
          <div className="space-y-4">
            {dataHistory.length > 0 ? (
              dataHistory.map((import_) => (
                <div key={import_.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {import_.filename}
                  </span>
                  <button
                    onClick={() => handleReportClick(import_)}
                    disabled={generating || !import_.data}
                    className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg btn-primary disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    {t('reports.generate')}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {t('reports.noHistoricalData')}
              </p>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSelect={handleGenerateReport}
        title={selectedImport ? `${t('reports.generate')} - ${selectedImport.filename}` : t('reports.generate')}
        options={reportOptions}
        generating={generating}
      />

      {generating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {t('reports.generating')}
            </h3>
            <ProgressBar progress={progress} />
          </div>
        </div>
      )}
    </div>
  );
}