import { useCallback, useMemo, useRef, useState } from "react";
import type { ApplicationFormContextValue } from "@/components/dashboard/entityData/ApplicationFormContext";
import {
  createEmptyBranch,
  DOCUMENT_SLOT_TYPES,
  EMPTY_APPLICATION_FORM,
  type ApplicationFormValues,
  type ApplicationNotification,
  type BranchFormValues,
} from "@/components/dashboard/entityData/applicationTypes";

const STORAGE_KEY = "icasco_cab_application_submission_draft";

function loadDraft(): ApplicationFormValues {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_APPLICATION_FORM;
  try {
    const stored = JSON.parse(raw) as ApplicationFormValues;
    return {
      ...EMPTY_APPLICATION_FORM,
      ...stored,
      declarationDate: stored.declarationDate
        ? new Date(stored.declarationDate)
        : undefined,
      branches: (stored.branches ?? []).map((branch) => ({
        ...branch,
        phase1ExpectedDate: branch.phase1ExpectedDate
          ? new Date(branch.phase1ExpectedDate)
          : undefined,
      })),
    };
  } catch {
    return EMPTY_APPLICATION_FORM;
  }
}

export function useCabApplicationSubmissionState() {
  const [form, setForm] = useState<ApplicationFormValues>(loadDraft);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] =
    useState<ApplicationNotification | null>(null);
  const nextBranchId = useRef(
    Math.max(1, ...form.branches.map((branch) => branch.localId + 1)),
  );

  const update = useCallback(
    <K extends keyof ApplicationFormValues>(
      key: K,
      value: ApplicationFormValues[K],
    ) => {
      setForm((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const updateBranch = useCallback(
    (localId: number, patch: Partial<BranchFormValues>) => {
      setForm((previous) => ({
        ...previous,
        branches: previous.branches.map((branch) =>
          branch.localId === localId ? { ...branch, ...patch } : branch,
        ),
      }));
    },
    [],
  );

  const addBranch = useCallback(() => {
    const localId = nextBranchId.current++;
    setForm((previous) => ({
      ...previous,
      branches: [...previous.branches, createEmptyBranch(localId)],
    }));
    return localId;
  }, []);

  const removeBranch = useCallback((localId: number) => {
    setForm((previous) => ({
      ...previous,
      branches: previous.branches.filter(
        (branch) => branch.localId !== localId,
      ),
    }));
  }, []);

  const setSpecAnswer = useCallback((questionKey: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      specAnswers: { ...previous.specAnswers, [questionKey]: value },
    }));
  }, []);

  const uploadDocument = useCallback(async (slotId: string, file: File) => {
    setUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      setForm((previous) => ({
        ...previous,
        documents: [
          {
            localId: crypto.randomUUID(),
            slotId,
            documentType: DOCUMENT_SLOT_TYPES[slotId] ?? "OTHER",
            fileUrl: objectUrl,
            filePath: objectUrl,
            fileName: file.name,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          },
          ...previous.documents,
        ],
      }));
    } finally {
      setUploading(false);
    }
  }, []);

  const removeDocument = useCallback(async (localId: string) => {
    setForm((previous) => ({
      ...previous,
      documents: previous.documents.filter(
        (document) => document.localId !== localId,
      ),
    }));
  }, []);

  const uploadCommercialRegister = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        update("commercialRegisterFile", URL.createObjectURL(file));
      } finally {
        setUploading(false);
      }
    },
    [update],
  );

  const notify = useCallback((value: ApplicationNotification) => {
    setNotification(value);
  }, []);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setNotification({
        type: "success",
        message: "Application draft saved locally.",
      });
      return true;
    } catch {
      setNotification({
        type: "error",
        message: "Unable to save the local draft.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [form]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const saved = await saveDraft();
      if (!saved) return false;
      setStatus("SUBMITTED");
      setNotification({
        type: "success",
        message: "Application submitted in this frontend preview.",
      });
      return true;
    } finally {
      setSubmitting(false);
    }
  }, [saveDraft]);

  const contextValue = useMemo<ApplicationFormContextValue>(
    () => ({
      form,
      update,
      updateBranch,
      addBranch,
      removeBranch,
      saveOrgBranch: () => undefined,
      setSpecAnswer,
      uploadDocument,
      removeDocument,
      uploadCommercialRegister,
      orgBranches: [],
      applicationId: null,
      status,
      saving,
      uploading,
      notify,
      handleApiError: () =>
        setNotification({
          type: "error",
          message: "Unable to complete this action.",
        }),
    }),
    [
      addBranch,
      form,
      notify,
      removeBranch,
      removeDocument,
      saving,
      setSpecAnswer,
      status,
      update,
      updateBranch,
      uploadCommercialRegister,
      uploadDocument,
      uploading,
    ],
  );

  return {
    contextValue,
    form,
    update,
    status,
    saving,
    submitting,
    notification,
    saveDraft,
    submit,
  };
}
