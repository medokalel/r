import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CabHeader } from "@/components/dashboard/cab/CabHeader";
import { useCabApplicationSubmissionState } from "@/components/dashboard/cab/useCabApplicationSubmissionState";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { EntityDataForm } from "@/components/dashboard/EntityDataForm";
import {
  EntityDataNav,
  subSections,
  type EntityDataSubSection,
  type EntityDataViewTab,
} from "@/components/dashboard/EntityDataNav";
import { ApplicationFormContext } from "@/components/dashboard/entityData/ApplicationFormContext";
import { FieldSelectionSummary } from "@/components/dashboard/entityData/FieldSelectionSummary";
import { isSectionComplete } from "@/components/dashboard/entityData/applicationValidation";
import type {
  FieldPhase,
  SectorKey,
  StandardKey,
} from "@/components/dashboard/entityData/fieldTypes";
import { ProcessStepper } from "@/components/dashboard/ProcessStepper";
import { CabLayout } from "@/components/layout/CabLayout";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const viewTabCopyKeys: Record<
  "entityData" | "field" | "documents",
  { title: string; subtitle: string }
> = {
  entityData: {
    title: "accreditation.entityData.title",
    subtitle: "accreditation.entityData.subtitle",
  },
  field: {
    title: "accreditation.entityData.field.pageTitle",
    subtitle: "accreditation.entityData.field.pageSubtitle",
  },
  documents: {
    title: "accreditation.entityData.documents.pageTitle",
    subtitle: "accreditation.entityData.documents.pageSubtitle",
  },
};

export function CabApplicationSubmissionPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSubSection, setActiveSubSection] =
    useState<EntityDataSubSection>("legalIdentity");
  const [activeViewTab, setActiveViewTab] =
    useState<Extract<EntityDataViewTab, "entityData" | "field" | "documents">>(
      "entityData",
    );
  const [fieldPhase, setFieldPhase] = useState<FieldPhase>("sectors");
  const [activeAction, setActiveAction] = useState<"next" | "draft" | null>(
    null,
  );

  const {
    contextValue,
    form,
    update,
    status,
    saving,
    submitting,
    notification,
    saveDraft,
    submit,
  } = useCabApplicationSubmissionState();

  const selectedSectors = form.selectedSectors;
  const selectedStandards = form.selectedStandards;
  const activeIndex = subSections.indexOf(activeSubSection);
  const copyKeys =
    activeViewTab === "field" && fieldPhase === "codes"
      ? {
          title: "accreditation.entityData.field.codesTitle",
          subtitle: "accreditation.entityData.field.pageSubtitle",
        }
      : viewTabCopyKeys[activeViewTab];

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSubSectionChange = useCallback(
    (section: EntityDataSubSection) => {
      setActiveSubSection(section);
      scrollToContent();
    },
    [scrollToContent],
  );

  const handleViewTabChange = useCallback(
    (tab: EntityDataViewTab) => {
      if (tab !== "entityData" && tab !== "field" && tab !== "documents")
        return;
      setActiveViewTab(tab);
      if (tab !== "field") setFieldPhase("sectors");
      scrollToContent();
    },
    [scrollToContent],
  );

  const handleBack = useCallback(() => {
    if (activeViewTab === "documents") {
      handleViewTabChange("field");
      return;
    }
    if (activeViewTab === "field" && fieldPhase === "codes") {
      setFieldPhase("sectors");
      return;
    }
    if (activeViewTab === "field") {
      handleViewTabChange("entityData");
      return;
    }
    if (activeIndex > 0) handleSubSectionChange(subSections[activeIndex - 1]);
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
  ]);

  const handleNext = useCallback(async () => {
    setActiveAction("next");
    try {
      if (activeViewTab === "documents") {
        await submit();
        return;
      }
      const saved = await saveDraft();
      if (!saved) return;
      if (activeViewTab === "field" && fieldPhase === "sectors") {
        setFieldPhase("codes");
      } else if (activeViewTab === "field") {
        handleViewTabChange("documents");
      } else if (activeIndex >= subSections.length - 1) {
        handleViewTabChange("field");
      } else {
        handleSubSectionChange(subSections[activeIndex + 1]);
      }
    } finally {
      setActiveAction(null);
    }
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
    saveDraft,
    submit,
  ]);

  const handleSaveDraft = useCallback(async () => {
    setActiveAction("draft");
    try {
      await saveDraft();
    } finally {
      setActiveAction(null);
    }
  }, [saveDraft]);

  const setSelectedSectors = useCallback(
    (standard: StandardKey, sectors: SectorKey[]) =>
      update("selectedSectors", {
        ...form.selectedSectors,
        [standard]: sectors,
      }),
    [form.selectedSectors, update],
  );
  const setSelectedStandards = useCallback(
    (standards: StandardKey[]) => update("selectedStandards", standards),
    [update],
  );
  const setSelectedCodes = useCallback(
    (codes: Record<string, string[]>) => update("selectedCodes", codes),
    [update],
  );

  const standardsMissingSectors = selectedStandards.filter(
    (standard) => (selectedSectors[standard] ?? []).length === 0,
  );
  const standardsMissingCodes = selectedStandards.filter(
    (standard) =>
      !Object.entries(form.selectedCodes).some(
        ([key, codes]) => key.startsWith(`${standard}:`) && codes.length > 0,
      ),
  );
  const anySectorSelected = Object.values(selectedSectors).some(
    (sectors) => sectors.length > 0,
  );
  const busy = saving || submitting;
  const nextDisabled =
    busy ||
    (activeViewTab === "entityData" &&
      !isSectionComplete(activeSubSection, form)) ||
    (activeViewTab === "field" &&
      fieldPhase === "sectors" &&
      (!anySectorSelected || standardsMissingSectors.length > 0)) ||
    (activeViewTab === "field" &&
      fieldPhase === "codes" &&
      standardsMissingCodes.length > 0) ||
    (activeViewTab === "documents" && !form.agreed);

  const missingHint =
    activeViewTab === "field" &&
    fieldPhase === "sectors" &&
    standardsMissingSectors.length > 0
      ? t("accreditation.entityData.field.missingSectorsHint", {
          standards: standardsMissingSectors.join(isRTL ? "، " : ", "),
        })
      : activeViewTab === "field" &&
          fieldPhase === "codes" &&
          standardsMissingCodes.length > 0
        ? t("accreditation.entityData.field.missingCodesHint", {
            standards: standardsMissingCodes.join(isRTL ? "، " : ", "),
          })
        : null;

  const footerStartContent = notification ? (
    <p
      className={cn(
        "min-w-0 truncate text-[14px] font-medium",
        notification.type === "success" ? "text-[#26a65b]" : "text-error-500",
      )}
    >
      {notification.message}
    </p>
  ) : missingHint ? (
    <p className="rounded-[var(--radius-sm)] bg-[#fef3c6] px-3 py-1.5 text-[14px] font-medium text-[#a58401]">
      {missingHint}
    </p>
  ) : activeViewTab === "field" && fieldPhase === "sectors" ? (
    <FieldSelectionSummary
      selectedSectors={[...new Set(Object.values(selectedSectors).flat())]}
    />
  ) : undefined;

  return (
    <CabLayout>
      <ApplicationFormContext.Provider value={contextValue}>
        <CabHeader
          title={t("cab.applicationSubmission.title", "Application Submission")}
          notificationCount={3}
        />
        {status === "SUBMITTED" ? (
          <>
            <ProcessStepper activeStep={1} />
            <main className="flex flex-1 flex-col gap-5 overflow-auto p-5">
              <nav className="flex items-center gap-2 text-[13px]">
                <Link
                  to={ROUTES.cabApplicationRegister}
                  className="text-neutral-400 hover:text-primary"
                >
                  {t("cab.applicationRegister.title")}
                </Link>
                <span className="text-neutral-400">/</span>
                <span className="font-medium text-neutral-700">
                  {t("cab.applicationSubmission.submitted", "Submitted")}
                </span>
              </nav>
              <div className="flex flex-1 flex-col rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
                <EntityDataForm section="legalIdentity" viewTab="underReview" />
                <Link
                  to={ROUTES.cabApplicationRegister}
                  className="mx-auto rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  {t(
                    "cab.applicationSubmission.backToRegister",
                    "Back to application register",
                  )}
                </Link>
              </div>
            </main>
          </>
        ) : (
          <>
            <ProcessStepper activeStep={0} />

            <div
              ref={contentRef}
              className="flex flex-1 flex-col gap-5 overflow-auto p-5"
            >
              <nav className="flex items-center gap-2 text-[13px]">
                <Link
                  to={ROUTES.cabApplicationRegister}
                  className="text-neutral-400 hover:text-primary"
                >
                  {t("cab.applicationRegister.title")}
                </Link>
                <span className="text-neutral-400">/</span>
                <span className="font-medium text-neutral-700">
                  {t(
                    "cab.applicationSubmission.title",
                    "Application Submission",
                  )}
                </span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-h3-semi text-neutral-900">
                  {t(copyKeys.title)}
                </h1>
                <p
                  className={cn(
                    "text-body-2 text-neutral-600",
                    isRTL && "font-light",
                  )}
                >
                  {t(copyKeys.subtitle)}
                </p>
              </div>

              <div className="flex flex-1 gap-5">
                <EntityDataNav
                  activeSubSection={activeSubSection}
                  activeViewTab={activeViewTab}
                  onSubSectionChange={handleSubSectionChange}
                  onViewTabChange={handleViewTabChange}
                />
                <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
                  <EntityDataForm
                    section={activeSubSection}
                    viewTab={activeViewTab}
                    fieldPhase={fieldPhase}
                    selectedSectors={selectedSectors}
                    onSelectedSectorsChange={setSelectedSectors}
                    selectedStandards={selectedStandards}
                    onSelectedStandardsChange={setSelectedStandards}
                    selectedCodes={form.selectedCodes}
                    onSelectedCodesChange={setSelectedCodes}
                  />
                </div>
              </div>
            </div>

            <DashboardFooter
              backDisabled={
                busy ||
                (activeViewTab === "entityData" && activeIndex === 0) ||
                (activeViewTab === "field" && fieldPhase === "sectors")
              }
              nextDisabled={nextDisabled}
              nextLabel={
                activeAction === "next" && busy
                  ? t("common.loading")
                  : activeViewTab === "documents"
                    ? t("accreditation.messages.submitRequest")
                    : undefined
              }
              startContent={footerStartContent}
              onBack={handleBack}
              onNext={handleNext}
              onSaveDraft={handleSaveDraft}
              saveDraftDisabled={busy}
              saveDraftLoading={saving && activeAction === "draft"}
            />
          </>
        )}
      </ApplicationFormContext.Provider>
    </CabLayout>
  );
}
