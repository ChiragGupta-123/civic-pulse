import { useEffect, useState } from 'react';
import { connectAgentWebSocket, type AgentWsEvent } from '../api/wsClient';
import { useLiveTaskStore } from '../stores/liveTask.store';
import type { AgentActionStepDto } from '../types/agent.types';

export interface UseAgentSocketReturn {
  isConnected: boolean;
  steps: AgentActionStepDto[];
  currentStatus: string | null;
  latestScreenshotUrl: string | null;
  trackingReceiptId: string | null;
  receiptPdfUrl: string | null;
  errorDetail: string | null;
}

export function useAgentSocket(runId: string | null | undefined): UseAgentSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [steps, setSteps] = useState<AgentActionStepDto[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [latestScreenshotUrl, setLatestScreenshotUrl] = useState<string | null>(null);
  const [trackingReceiptId, setTrackingReceiptId] = useState<string | null>(null);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const { setHitlRequired, clearHitl, setActiveRun } = useLiveTaskStore();

  useEffect(() => {
    if (!runId) {
      setSteps([]);
      setCurrentStatus(null);
      setLatestScreenshotUrl(null);
      return;
    }

    setActiveRun(runId, 'RUNNING');
    setIsConnected(true);

    const cleanup = connectAgentWebSocket(
      runId,
      (event: AgentWsEvent) => {
        if (event.event === 'STEP_UPDATE') {
          if (event.screenshot_url) {
            setLatestScreenshotUrl(event.screenshot_url);
          }
          if (event.status) {
            setCurrentStatus(event.status);
          }
          if (event.step_number && event.action) {
            const newStep: AgentActionStepDto = {
              step_number: event.step_number,
              action: event.action,
              detail: event.detail || '',
              screenshot_url: event.screenshot_url,
              status: event.status || 'COMPLETED',
              timestamp: event.timestamp || new Date().toISOString(),
            };
            setSteps((prev) => {
              const filtered = prev.filter((s) => s.step_number !== newStep.step_number);
              return [...filtered, newStep].sort((a, b) => a.step_number - b.step_number);
            });
          }
        } else if (event.event === 'AGENT_HITL_REQUIRED') {
          setCurrentStatus('WAITING_FOR_HITL');
          if (event.obstacle_screenshot_url) {
            setLatestScreenshotUrl(event.obstacle_screenshot_url);
          }
          setHitlRequired(
            event.prompt_message || 'Enter 6-digit SMS OTP',
            event.obstacle_screenshot_url || null
          );
        } else if (event.event === 'AGENT_COMPLETED') {
          setCurrentStatus('COMPLETED');
          clearHitl();
          if (event.tracking_receipt_id) setTrackingReceiptId(event.tracking_receipt_id);
          if (event.receipt_pdf_url) setReceiptPdfUrl(event.receipt_pdf_url);
        } else if (event.event === 'AGENT_FAILED') {
          setCurrentStatus('FAILED');
          clearHitl();
          if (event.error) setErrorDetail(event.error);
        }
      },
      () => {
        setIsConnected(false);
      }
    );

    return () => {
      cleanup();
      setIsConnected(false);
    };
  }, [runId, setActiveRun, setHitlRequired, clearHitl]);

  return {
    isConnected,
    steps,
    currentStatus,
    latestScreenshotUrl,
    trackingReceiptId,
    receiptPdfUrl,
    errorDetail,
  };
}

