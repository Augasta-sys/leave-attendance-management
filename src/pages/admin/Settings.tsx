import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from "lucide-react";

interface SettingsState {
  companyName: string;
  workingHours: string;
  officeStartTime: string;
  officeEndTime: string;
  gracePeriod: string;
  leaveApprovalRequired: boolean;
  allowPastLeave: boolean;
  allowEmployeeCancellation: boolean;
  emailNotifications: boolean;
  leaveNotifications: boolean;
  attendanceNotifications: boolean;
  twoFactorAuthentication: boolean;
  sessionTimeout: string;
}

const initialSettings: SettingsState = {
  companyName: "Leave & Attendance Management System",
  workingHours: "8",
  officeStartTime: "09:30",
  officeEndTime: "18:00",
  gracePeriod: "15",
  leaveApprovalRequired: true,
  allowPastLeave: false,
  allowEmployeeCancellation: true,
  emailNotifications: true,
  leaveNotifications: true,
  attendanceNotifications: true,
  twoFactorAuthentication: false,
  sessionTimeout: "30",
};

export default function Settings() {
  const [settings, setSettings] =
    useState<SettingsState>(() => {
      const savedSettings =
        localStorage.getItem(
          "attendanceSettings",
        );

      if (!savedSettings) {
        return initialSettings;
      }

      try {
        return {
          ...initialSettings,
          ...JSON.parse(savedSettings),
        };
      } catch {
        return initialSettings;
      }
    });

  const [saved, setSaved] = useState(false);

  const updateSetting = <
    K extends keyof SettingsState,
  >(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(
      "attendanceSettings",
      JSON.stringify(settings),
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div>
        <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Settings
        </h1>

        <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
          Configure system, attendance, leave and
          notification preferences.
        </p>
      </div>

      {/* SETTINGS CONTENT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {/* GENERAL SETTINGS */}
          <SettingsSection
            icon={<SettingsIcon size={20} />}
            title="General Settings"
            description="Basic information about your organization."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FieldWrapper
                label="Company Name"
              >
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(event) =>
                    updateSetting(
                      "companyName",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Working Hours Per Day"
              >
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={settings.workingHours}
                  onChange={(event) =>
                    updateSetting(
                      "workingHours",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FieldWrapper>
            </div>
          </SettingsSection>

          {/* ATTENDANCE SETTINGS */}
          <SettingsSection
            icon={<Clock3 size={20} />}
            title="Attendance Settings"
            description="Configure office timings and attendance rules."
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
             <FieldWrapper label="Office Start Time">
  <input
    type="time"
    value={settings.officeStartTime}
    onChange={(event) =>
      updateSetting(
        "officeStartTime",
        event.target.value,
      )
    }
    className={`
      ${inputClass}
      dark:[color-scheme:dark]
    `}
  />
</FieldWrapper>

             <FieldWrapper label="Office End Time">
  <input
    type="time"
    value={settings.officeEndTime}
    onChange={(event) =>
      updateSetting(
        "officeEndTime",
        event.target.value,
      )
    }
    className={`
      ${inputClass}
      dark:[color-scheme:dark]
    `}
  />
</FieldWrapper>

              <FieldWrapper
                label="Late Grace Period"
                helper="Minutes allowed after office start time."
              >
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.gracePeriod}
                  onChange={(event) =>
                    updateSetting(
                      "gracePeriod",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </FieldWrapper>
            </div>
          </SettingsSection>

          {/* LEAVE SETTINGS */}
          <SettingsSection
            icon={<CalendarDays size={20} />}
            title="Leave Settings"
            description="Configure employee leave policies."
          >
            <div className="divide-y divide-[#E1E5EA] dark:divide-[#333333]">
              <ToggleRow
                title="Leave Approval Required"
                description="Leave requests must be approved before becoming effective."
                checked={
                  settings.leaveApprovalRequired
                }
                onChange={(value) =>
                  updateSetting(
                    "leaveApprovalRequired",
                    value,
                  )
                }
              />

              <ToggleRow
                title="Allow Past Leave Requests"
                description="Allow employees to submit leave requests for previous dates."
                checked={
                  settings.allowPastLeave
                }
                onChange={(value) =>
                  updateSetting(
                    "allowPastLeave",
                    value,
                  )
                }
              />

              <ToggleRow
                title="Allow Employee Cancellation"
                description="Employees can cancel their pending leave requests."
                checked={
                  settings.allowEmployeeCancellation
                }
                onChange={(value) =>
                  updateSetting(
                    "allowEmployeeCancellation",
                    value,
                  )
                }
              />
            </div>
          </SettingsSection>

          {/* NOTIFICATIONS */}
          <SettingsSection
            icon={<Bell size={20} />}
            title="Notifications"
            description="Choose which system notifications are enabled."
          >
            <div className="divide-y divide-[#E1E5EA] dark:divide-[#333333]">
              <ToggleRow
                title="Email Notifications"
                description="Send important system updates through email."
                checked={
                  settings.emailNotifications
                }
                onChange={(value) =>
                  updateSetting(
                    "emailNotifications",
                    value,
                  )
                }
              />

              <ToggleRow
                title="Leave Notifications"
                description="Notify relevant users when leave requests are submitted or updated."
                checked={
                  settings.leaveNotifications
                }
                onChange={(value) =>
                  updateSetting(
                    "leaveNotifications",
                    value,
                  )
                }
              />

              <ToggleRow
                title="Attendance Notifications"
                description="Notify users about attendance-related updates."
                checked={
                  settings.attendanceNotifications
                }
                onChange={(value) =>
                  updateSetting(
                    "attendanceNotifications",
                    value,
                  )
                }
              />
            </div>
          </SettingsSection>

          {/* SECURITY */}
          <SettingsSection
            icon={<ShieldCheck size={20} />}
            title="Security"
            description="Configure account and session security."
          >
            <div className="space-y-1">
              <ToggleRow
                title="Two-Factor Authentication"
                description="Require an additional verification step when signing in."
                checked={
                  settings.twoFactorAuthentication
                }
                onChange={(value) =>
                  updateSetting(
                    "twoFactorAuthentication",
                    value,
                  )
                }
              />

              <div className="border-t border-[#E1E5EA] pt-5 dark:border-[#333333]">
                <FieldWrapper
                  label="Session Timeout"
                  helper="Automatically sign out inactive users after the selected duration."
                >
                  <select
                    value={settings.sessionTimeout}
                    onChange={(event) =>
                      updateSetting(
                        "sessionTimeout",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="15">
                      15 minutes
                    </option>

                    <option value="30">
                      30 minutes
                    </option>

                    <option value="60">
                      1 hour
                    </option>

                    <option value="120">
                      2 hours
                    </option>

                    <option value="240">
                      4 hours
                    </option>
                  </select>
                </FieldWrapper>
              </div>
            </div>
          </SettingsSection>

          {/* SAVE BUTTON */}
          <div
            className="
              flex flex-col gap-3
              rounded-2xl border p-4
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
              sm:flex-row sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-2">
              {saved && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                    <Check size={17} />
                  </div>

                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Settings saved successfully.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="
                inline-flex h-11
                items-center justify-center
                gap-2 rounded-xl
                bg-[#0066FF] px-5
                text-sm font-semibold
                text-white
                transition
                hover:bg-[#0052CC]
                dark:bg-[#1E90FF]
                dark:hover:bg-[#1878D1]
              "
            >
              <Save size={17} />
              Save Changes
            </button>
          </div>
        </div>

        {/* SIDE INFORMATION */}
        <div className="h-fit space-y-4 xl:sticky xl:top-6">
          <div
            className="
              rounded-2xl border p-5 shadow-sm
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0066FF] dark:bg-[#10233F] dark:text-[#1E90FF]">
              <SettingsIcon size={21} />
            </div>

            <h3 className="mt-4 text-base font-bold">
              System Configuration
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-[#B3B3B3]">
              These settings control general behavior
              of the Leave & Attendance Management
              System.
            </p>
          </div>

          <div
            className="
              rounded-2xl border p-5 shadow-sm
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Users size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Admin Only
                </p>

                <p className="text-xs text-[#667085] dark:text-[#888888]">
                  Restricted configuration
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#667085] dark:text-[#999999]">
              Settings are available only to
              administrators. HR, managers and
              employees do not have access to this
              page.
            </p>
          </div>

          <div
            className="
              rounded-2xl border p-5 shadow-sm
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <LockKeyhole size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Security
                </p>

                <p className="text-xs text-[#667085] dark:text-[#888888]">
                  Access protection
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#667085] dark:text-[#999999]">
              Keep session and authentication
              settings configured according to
              your organization's requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* SETTINGS SECTION */
/* -------------------------------------------------- */

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-2xl border shadow-sm
        border-[#E1E5EA]
        bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex items-start gap-3 border-b border-[#E1E5EA] p-5 dark:border-[#333333]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0066FF] dark:bg-[#10233F] dark:text-[#1E90FF]">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-bold">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-[#888888]">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

/* -------------------------------------------------- */
/* FIELD */
/* -------------------------------------------------- */

function FieldWrapper({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs text-[#667085] dark:text-[#888888]">
          {helper}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* TOGGLE */
/* -------------------------------------------------- */

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#667085] dark:text-[#888888]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`
          relative
          h-7 w-12
          shrink-0
          rounded-full
          border
          p-0.5
          transition-all
          duration-200
          ease-in-out
          focus:outline-none
          focus:ring-2
          focus:ring-[#0066FF]/30
          dark:focus:ring-[#1E90FF]/30

          ${
            checked
              ? `
                border-[#0066FF]
                bg-[#0066FF]
                dark:border-[#1E90FF]
                dark:bg-[#1E90FF]
              `
              : `
                border-[#D0D5DD]
                bg-[#D0D5DD]
                dark:border-[#4A4A4A]
                dark:bg-[#4A4A4A]
              `
          }
        `}
      >
        <span
          className={`
            block
            h-5 w-5
            rounded-full
            bg-white
            shadow-md
            ring-1
            ring-black/5
            transition-transform
            duration-200
            ease-in-out

            ${
              checked
                ? "translate-x-5"
                : "translate-x-0"
            }
          `}
        />
      </button>
    </div>
  );
}

const inputClass = `
  h-11 w-full rounded-xl border
  border-[#D0D5DD]
  bg-white
  px-3
  text-sm
  text-[#1A1A2E]
  outline-none
  transition
  focus:border-[#0066FF]
  focus:ring-2
  focus:ring-[#0066FF]/10

  dark:border-[#3A3A3A]
  dark:bg-[#101010]
  dark:text-white
  dark:focus:border-[#1E90FF]
  dark:focus:ring-[#1E90FF]/10
`;