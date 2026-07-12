import { useQuery, useMutation } from '@tanstack/react-query';
import { reportApi } from '../services/report.service.js';
import toast from 'react-hot-toast';

export const useReportsAnalytics = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.getAnalytics(),
  });
};

export const useExportReportsCSV = () => {
  return useMutation({
    mutationFn: () => reportApi.exportCSV(),
    onSuccess: (blob) => {
      // Create a local blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TransitOps_ROI_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('ROI report exported to CSV successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to export CSV report');
    },
  });
};
