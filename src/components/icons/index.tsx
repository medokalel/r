import type { FC, SVGProps } from 'react'
import type { IconProps } from 'iconsax-reactjs'
import { defaultIconProps } from './constants'
import {
  AddCircle,
  ArrowDown2,
  BoxSearch,
  Buildings,
  Call,
  Category,
  Check,
  ClipboardText,
  CloseCircle,
  Document,
  DocumentText,
  Edit2,
  Element3,
  Export,
  ExportSquare,
  Eye,
  EyeSlash,
  Global,
  Import,
  Judge,
  Location,
  LocationAdd,
  Lock1,
  Logout,
  MessageEdit,
  Monitor,
  Notification,
  PictureFrame,
  Profile2User,
  ReceiptItem,
  Refresh2,
  RowVertical,
  Scroll,
  SearchNormal,
  Setting2,
  ShieldTick,
  SidebarLeft,
  SidebarRight,
  Sms,
  TaskSquare,
  Text,
  TextBold,
  TickCircle,
  User,
  UserOctagon,
  Wallet,
  Warning2,
  Paperclip2,
  Link21,
} from 'iconsax-reactjs'

export type AppIconComponent = FC<IconProps>


export function AppIcon({
  icon: Icon,
  size = 16,
  className,
  ...props
}: IconProps & { icon: AppIconComponent }) {
  return <Icon size={size} className={className} {...defaultIconProps} {...props} />
}

export function CalendarIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path d="M8 5.75C7.59 5.75 7.25 5.41 7.25 5V2C7.25 1.59 7.59 1.25 8 1.25C8.41 1.25 8.75 1.59 8.75 2V5C8.75 5.41 8.41 5.75 8 5.75Z" fill="currentColor"/>
      <path d="M16 5.75C15.59 5.75 15.25 5.41 15.25 5V2C15.25 1.59 15.59 1.25 16 1.25C16.41 1.25 16.75 1.59 16.75 2V5C16.75 5.41 16.41 5.75 16 5.75Z" fill="currentColor"/>
      <path d="M8.5 14.5003C8.37 14.5003 8.24 14.4703 8.12 14.4203C7.99 14.3703 7.89 14.3003 7.79 14.2103C7.61 14.0203 7.5 13.7703 7.5 13.5003C7.5 13.3703 7.53 13.2403 7.58 13.1203C7.63 13.0003 7.7 12.8903 7.79 12.7903C7.89 12.7003 7.99 12.6303 8.12 12.5803C8.48 12.4303 8.93 12.5103 9.21 12.7903C9.39 12.9803 9.5 13.2403 9.5 13.5003C9.5 13.5603 9.49 13.6303 9.48 13.7003C9.47 13.7603 9.45 13.8203 9.42 13.8803C9.4 13.9403 9.37 14.0003 9.33 14.0603C9.3 14.1103 9.25 14.1603 9.21 14.2103C9.02 14.3903 8.76 14.5003 8.5 14.5003Z" fill="currentColor"/>
      <path d="M12 14.4999C11.87 14.4999 11.74 14.4699 11.62 14.4199C11.49 14.3699 11.39 14.2999 11.29 14.2099C11.11 14.0199 11 13.7699 11 13.4999C11 13.3699 11.03 13.2399 11.08 13.1199C11.13 12.9999 11.2 12.8899 11.29 12.7899C11.39 12.6999 11.49 12.6299 11.62 12.5799C11.98 12.4199 12.43 12.5099 12.71 12.7899C12.89 12.9799 13 13.2399 13 13.4999C13 13.5599 12.99 13.6299 12.98 13.6999C12.97 13.7599 12.95 13.8199 12.92 13.8799C12.9 13.9399 12.87 13.9999 12.83 14.0599C12.8 14.1099 12.75 14.1599 12.71 14.2099C12.52 14.3899 12.26 14.4999 12 14.4999Z" fill="currentColor"/>
      <path d="M15.5 14.4999C15.37 14.4999 15.24 14.4699 15.12 14.4199C14.99 14.3699 14.89 14.2999 14.79 14.2099C14.75 14.1599 14.71 14.1099 14.67 14.0599C14.63 13.9999 14.6 13.9399 14.58 13.8799C14.55 13.8199 14.53 13.7599 14.52 13.6999C14.51 13.6299 14.5 13.5599 14.5 13.4999C14.5 13.2399 14.61 12.9799 14.79 12.7899C14.89 12.6999 14.99 12.6299 15.12 12.5799C15.49 12.4199 15.93 12.5099 16.21 12.7899C16.39 12.9799 16.5 13.2399 16.5 13.4999C16.5 13.5599 16.49 13.6299 16.48 13.6999C16.47 13.7599 16.45 13.8199 16.42 13.8799C16.4 13.9399 16.37 13.9999 16.33 14.0599C16.3 14.1099 16.25 14.1599 16.21 14.2099C16.02 14.3899 15.76 14.4999 15.5 14.4999Z" fill="currentColor"/>
      <path d="M8.5 18.0002C8.37 18.0002 8.24 17.9702 8.12 17.9202C8 17.8702 7.89 17.8002 7.79 17.7102C7.61 17.5202 7.5 17.2602 7.5 17.0002C7.5 16.8702 7.53 16.7402 7.58 16.6202C7.63 16.4902 7.7 16.3802 7.79 16.2902C8.16 15.9202 8.84 15.9202 9.21 16.2902C9.39 16.4802 9.5 16.7402 9.5 17.0002C9.5 17.2602 9.39 17.5202 9.21 17.7102C9.02 17.8902 8.76 18.0002 8.5 18.0002Z" fill="currentColor"/>
      <path d="M12 18.0002C11.74 18.0002 11.48 17.8902 11.29 17.7102C11.11 17.5202 11 17.2602 11 17.0002C11 16.8702 11.03 16.7402 11.08 16.6202C11.13 16.4902 11.2 16.3802 11.29 16.2902C11.66 15.9202 12.34 15.9202 12.71 16.2902C12.8 16.3802 12.87 16.4902 12.92 16.6202C12.97 16.7402 13 16.8702 13 17.0002C13 17.2602 12.89 17.5202 12.71 17.7102C12.52 17.8902 12.26 18.0002 12 18.0002Z" fill="currentColor"/>
      <path d="M15.5 17.9999C15.24 17.9999 14.98 17.8899 14.79 17.7099C14.7 17.6199 14.63 17.5099 14.58 17.3799C14.53 17.2599 14.5 17.1299 14.5 16.9999C14.5 16.8699 14.53 16.7399 14.58 16.6199C14.63 16.4899 14.7 16.3799 14.79 16.2899C15.02 16.0599 15.37 15.9499 15.69 16.0199C15.76 16.0299 15.82 16.0499 15.88 16.0799C15.94 16.0999 16 16.1299 16.06 16.1699C16.11 16.1999 16.16 16.2499 16.21 16.2899C16.39 16.4799 16.5 16.7399 16.5 16.9999C16.5 17.2599 16.39 17.5199 16.21 17.7099C16.02 17.8899 15.76 17.9999 15.5 17.9999Z" fill="currentColor"/>
      <path d="M20.5 9.83984H3.5C3.09 9.83984 2.75 9.49984 2.75 9.08984C2.75 8.67984 3.09 8.33984 3.5 8.33984H20.5C20.91 8.33984 21.25 8.67984 21.25 9.08984C21.25 9.49984 20.91 9.83984 20.5 9.83984Z" fill="currentColor"/>
      <path d="M16 22.75H8C4.35 22.75 2.25 20.65 2.25 17V8.5C2.25 4.85 4.35 2.75 8 2.75H16C19.65 2.75 21.75 4.85 21.75 8.5V17C21.75 20.65 19.65 22.75 16 22.75ZM8 4.25C5.14 4.25 3.75 5.64 3.75 8.5V17C3.75 19.86 5.14 21.25 8 21.25H16C18.86 21.25 20.25 19.86 20.25 17V8.5C20.25 5.64 18.86 4.25 16 4.25H8Z" fill="currentColor"/>
    </svg>
  )
}

export const DashboardGridIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3.75" y="3.75" width="6.5" height="16.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13.75" y="13.75" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

export const RequestsListIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3.75" y="13.75" width="16.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3.75" y="3.75" width="12.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

export const WalletCardIcon: AppIconComponent = ({ size = 32, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M23.652 30.334H8.34537C5.02536 30.334 2.33203 27.6406 2.33203 24.3206V15.3473C2.33203 12.0273 5.02536 9.33398 8.34537 9.33398H23.652C26.972 9.33398 29.6654 12.0273 29.6654 15.3473V17.2673C29.6654 17.814 29.212 18.2673 28.6654 18.2673H25.972C25.5054 18.2673 25.0787 18.4407 24.772 18.7607L24.7587 18.774C24.3854 19.134 24.212 19.6273 24.252 20.134C24.332 21.014 25.172 21.7206 26.132 21.7206H28.6654C29.212 21.7206 29.6654 22.174 29.6654 22.7206V24.3073C29.6654 27.6406 26.972 30.334 23.652 30.334ZM8.34537 11.334C6.13203 11.334 4.33203 13.134 4.33203 15.3473V24.3206C4.33203 26.534 6.13203 28.334 8.34537 28.334H23.652C25.8654 28.334 27.6654 26.534 27.6654 24.3206V23.734H26.132C24.1187 23.734 22.412 22.2406 22.252 20.3206C22.1454 19.2273 22.5454 18.1473 23.3454 17.3607C24.0387 16.654 24.972 16.2673 25.972 16.2673H27.6654V15.3473C27.6654 13.134 25.8654 11.334 23.652 11.334H8.34537Z" fill="currentColor"/>
    <path d="M3.33203 17.546C2.78536 17.546 2.33203 17.0927 2.33203 16.546V10.4528C2.33203 8.4661 3.58536 6.66602 5.4387 5.95936L16.0254 1.95936C17.1187 1.54602 18.332 1.69275 19.2787 2.35942C20.2387 3.02609 20.7987 4.10608 20.7987 5.26608V10.3327C20.7987 10.8794 20.3454 11.3327 19.7987 11.3327C19.252 11.3327 18.7987 10.8794 18.7987 10.3327V5.26608C18.7987 4.75941 18.5587 4.29273 18.132 3.99939C17.7054 3.70606 17.1987 3.63939 16.7187 3.82606L6.13203 7.82605C5.05203 8.23939 4.3187 9.29276 4.3187 10.4528V16.546C4.33203 17.106 3.8787 17.546 3.33203 17.546Z" fill="currentColor"/>
    <path d="M26.1352 23.7323C24.1219 23.7323 22.4152 22.2389 22.2552 20.3189C22.1486 19.2123 22.5486 18.1323 23.3486 17.3456C24.0286 16.6523 24.9619 16.2656 25.9619 16.2656H28.7352C30.0552 16.3056 31.0686 17.3456 31.0686 18.6256V21.3723C31.0686 22.6523 30.0552 23.6923 28.7752 23.7323H26.1352ZM28.7086 18.2656H25.9752C25.5086 18.2656 25.0819 18.439 24.7752 18.759C24.3886 19.1323 24.2019 19.6389 24.2552 20.1456C24.3352 21.0256 25.1752 21.7323 26.1352 21.7323H28.7486C28.9219 21.7323 29.0819 21.5723 29.0819 21.3723V18.6256C29.0819 18.4256 28.9219 18.279 28.7086 18.2656Z" fill="currentColor"/>
    <path d="M18.6654 17H9.33203C8.78536 17 8.33203 16.5467 8.33203 16C8.33203 15.4533 8.78536 15 9.33203 15H18.6654C19.212 15 19.6654 15.4533 19.6654 16C19.6654 16.5467 19.212 17 18.6654 17Z" fill="currentColor"/>
  </svg>
)

export const DocumentsSidebarIcon: AppIconComponent = ({ size = 32, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M20.0013 30.3332H12.0013C4.7613 30.3332 1.66797 27.2398 1.66797 19.9998V11.9998C1.66797 4.75984 4.7613 1.6665 12.0013 1.6665H18.668C19.2146 1.6665 19.668 2.11984 19.668 2.6665C19.668 3.21317 19.2146 3.6665 18.668 3.6665H12.0013C5.85463 3.6665 3.66797 5.85317 3.66797 11.9998V19.9998C3.66797 26.1465 5.85463 28.3332 12.0013 28.3332H20.0013C26.148 28.3332 28.3346 26.1465 28.3346 19.9998V13.3332C28.3346 12.7865 28.788 12.3332 29.3346 12.3332C29.8813 12.3332 30.3346 12.7865 30.3346 13.3332V19.9998C30.3346 27.2398 27.2413 30.3332 20.0013 30.3332Z" fill="currentColor"/>
    <path d="M29.3346 14.3332H24.0013C19.4413 14.3332 17.668 12.5598 17.668 7.99982V2.66649C17.668 2.26649 17.908 1.89316 18.2813 1.74649C18.6546 1.58649 19.0813 1.67982 19.3746 1.95982L30.0413 12.6265C30.3213 12.9065 30.4146 13.3465 30.2546 13.7198C30.0946 14.0932 29.7346 14.3332 29.3346 14.3332ZM19.668 5.07982V7.99982C19.668 11.4398 20.5613 12.3332 24.0013 12.3332H26.9213L19.668 5.07982Z" fill="currentColor"/>
    <path d="M17.332 18.3335H9.33203C8.78536 18.3335 8.33203 17.8802 8.33203 17.3335C8.33203 16.7868 8.78536 16.3335 9.33203 16.3335H17.332C17.8787 16.3335 18.332 16.7868 18.332 17.3335C18.332 17.8802 17.8787 18.3335 17.332 18.3335Z" fill="currentColor"/>
    <path d="M14.6654 23.6665H9.33203C8.78536 23.6665 8.33203 23.2132 8.33203 22.6665C8.33203 22.1198 8.78536 21.6665 9.33203 21.6665H14.6654C15.212 21.6665 15.6654 22.1198 15.6654 22.6665C15.6654 23.2132 15.212 23.6665 14.6654 23.6665Z" fill="currentColor"/>
  </svg>
)

export const RenewalsIcon: AppIconComponent = ({ size = 32, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M29.3346 15.9998C29.3346 23.3598 23.3613 29.3332 16.0013 29.3332C8.6413 29.3332 4.14797 21.9198 4.14797 21.9198M4.14797 28.5865V21.9198H10.1746M2.66797 15.9998C2.66797 8.63984 8.58797 2.6665 16.0013 2.6665C24.8946 2.6665 29.3346 10.0798 29.3346 10.0798M23.4146 10.0798H29.3346V3.41317"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ExternalLinkArrowIcon: AppIconComponent = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.66797 9.33333L14.0013 2" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8.66667V12.6667C12 13.4026 11.4026 14 10.6667 14H3.33333C2.59745 14 2 13.4026 2 12.6667V5.33333C2 4.59745 2.59745 4 3.33333 4H7.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Shared delete icon for all delete actions across the dashboard
export const TrashIcon: AppIconComponent = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M15.8333 7.49935L15.2367 15.255C15.1032 16.9917 13.655 18.3327 11.9132 18.3327H8.08677C6.34498 18.3327 4.89684 16.9917 4.76326 15.255L4.16667 7.49935M17.5 5.83268C15.3351 4.77766 12.7614 4.16602 10 4.16602C7.23862 4.16602 4.66493 4.77766 2.5 5.83268M8.33333 4.16602V3.33268C8.33333 2.41221 9.07953 1.66602 10 1.66602C10.9205 1.66602 11.6667 2.41221 11.6667 3.33268V4.16602M8.33333 9.16602V14.166M11.6667 9.16602V14.166" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
  </svg>
)

export const SearchOutlineIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="2.07725" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2.07725" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const UploadTrayIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M15.26 22.2503H8.73998C3.82998 22.2503 1.72998 20.1503 1.72998 15.2403V15.1103C1.72998 10.6703 3.47998 8.53027 7.39998 8.16027C7.79998 8.13027 8.17998 8.43027 8.21998 8.84027C8.25998 9.25027 7.95998 9.62027 7.53998 9.66027C4.39998 9.95027 3.22998 11.4303 3.22998 15.1203V15.2503C3.22998 19.3203 4.66998 20.7603 8.73998 20.7603H15.26C19.33 20.7603 20.77 19.3203 20.77 15.2503V15.1203C20.77 11.4103 19.58 9.93027 16.38 9.66027C15.97 9.62027 15.66 9.26027 15.7 8.85027C15.74 8.44027 16.09 8.13027 16.51 8.17027C20.49 8.51027 22.27 10.6603 22.27 15.1303V15.2603C22.27 20.1503 20.17 22.2503 15.26 22.2503Z" fill="currentColor"/>
    <path d="M12 15.7501C11.59 15.7501 11.25 15.4101 11.25 15.0001V3.62012C11.25 3.21012 11.59 2.87012 12 2.87012C12.41 2.87012 12.75 3.21012 12.75 3.62012V15.0001C12.75 15.4101 12.41 15.7501 12 15.7501Z" fill="currentColor"/>
    <path d="M15.3498 6.60043C15.1598 6.60043 14.9698 6.53043 14.8198 6.38043L11.9998 3.56043L9.17984 6.38043C8.88984 6.67043 8.40984 6.67043 8.11984 6.38043C7.82984 6.09043 7.82984 5.61043 8.11984 5.32043L11.4698 1.97043C11.7598 1.68043 12.2398 1.68043 12.5298 1.97043L15.8798 5.32043C16.1698 5.61043 16.1698 6.09043 15.8798 6.38043C15.7398 6.53043 15.5398 6.60043 15.3498 6.60043Z" fill="currentColor"/>
  </svg>
)

export const DownloadTrayIcon: AppIconComponent = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M10 12.5V2.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 12.5V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V12.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.83203 8.33301L9.9987 12.4997L14.1654 8.33301" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ExternalLinkOutlineIcon: AppIconComponent = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M7.99967 15.1673C4.04634 15.1673 0.833008 11.954 0.833008 8.00065C0.833008 4.04732 4.04634 0.833984 7.99967 0.833984C8.27301 0.833984 8.49967 1.06065 8.49967 1.33398C8.49967 1.60732 8.27301 1.83398 7.99967 1.83398C4.59967 1.83398 1.83301 4.60065 1.83301 8.00065C1.83301 11.4007 4.59967 14.1673 7.99967 14.1673C11.3997 14.1673 14.1663 11.4007 14.1663 8.00065C14.1663 7.72732 14.393 7.50065 14.6663 7.50065C14.9397 7.50065 15.1663 7.72732 15.1663 8.00065C15.1663 11.954 11.953 15.1673 7.99967 15.1673Z" fill="currentColor"/>
    <path d="M8.6663 7.83414C8.53964 7.83414 8.41297 7.78747 8.31297 7.68747C8.11964 7.49414 8.11964 7.17414 8.31297 6.98081L13.7796 1.51414C13.973 1.32081 14.293 1.32081 14.4863 1.51414C14.6796 1.70747 14.6796 2.02747 14.4863 2.22081L9.01964 7.68747C8.91964 7.78747 8.79297 7.83414 8.6663 7.83414Z" fill="currentColor"/>
    <path d="M14.6663 5.05398C14.393 5.05398 14.1663 4.82732 14.1663 4.55398V1.83398H11.4463C11.173 1.83398 10.9463 1.60732 10.9463 1.33398C10.9463 1.06065 11.173 0.833984 11.4463 0.833984H14.6663C14.9396 0.833984 15.1663 1.06065 15.1663 1.33398V4.55398C15.1663 4.82732 14.9396 5.05398 14.6663 5.05398Z" fill="currentColor"/>
  </svg>
)

export const BuildingIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M11.9992 10.0006H12.0092M11.9992 14.001H12.0092M11.9992 6.00032H12.0092M15.9988 10.0006H16.0088M15.9988 14.001H16.0088M15.9988 6.00032H16.0088M7.9996 10.0006H8.0096M7.9996 14.001H8.0096M7.9996 6.00032H8.0096M8.9995 22.0016V19.0014C8.9995 18.7361 9.10485 18.4817 9.29236 18.2942C9.47988 18.1066 9.73421 18.0013 9.9994 18.0013H13.999C14.2642 18.0013 14.5185 18.1066 14.706 18.2942C14.8936 18.4817 14.9989 18.7361 14.9989 19.0014V22.0016M5.9998 2H17.9986C19.1031 2 19.9984 2.8955 19.9984 4.00016V20.0014C19.9984 21.1061 19.1031 22.0016 17.9986 22.0016H5.9998C4.89534 22.0016 4 21.1061 4 20.0014V4.00016C4 2.8955 4.89534 2 5.9998 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const UploadOutlineIcon: AppIconComponent = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M25.4338 37.0825H14.5671C6.38379 37.0825 2.88379 33.5825 2.88379 25.3991V25.1825C2.88379 17.7825 5.80046 14.2158 12.3338 13.5991C13.0005 13.5491 13.6338 14.0491 13.7005 14.7325C13.7671 15.4158 13.2671 16.0325 12.5671 16.0991C7.33379 16.5825 5.38379 19.0491 5.38379 25.1991V25.4158C5.38379 32.1991 7.78379 34.5991 14.5671 34.5991H25.4338C32.2171 34.5991 34.6171 32.1991 34.6171 25.4158V25.1991C34.6171 19.0158 32.6338 16.5491 27.3005 16.0991C26.6171 16.0325 26.1005 15.4325 26.1671 14.7491C26.2338 14.0658 26.8171 13.5491 27.5171 13.6158C34.1505 14.1825 37.1171 17.7658 37.1171 25.2158V25.4325C37.1171 33.5825 33.6171 37.0825 25.4338 37.0825Z" fill="currentColor"/>
    <path d="M20 26.2499C19.3167 26.2499 18.75 25.6832 18.75 24.9999V6.0332C18.75 5.34987 19.3167 4.7832 20 4.7832C20.6833 4.7832 21.25 5.34987 21.25 6.0332V24.9999C21.25 25.6832 20.6833 26.2499 20 26.2499Z" fill="currentColor"/>
    <path d="M25.5834 10.9991C25.2667 10.9991 24.9501 10.8824 24.7001 10.6324L20.0001 5.93242L15.3001 10.6324C14.8167 11.1158 14.0167 11.1158 13.5334 10.6324C13.0501 10.1491 13.0501 9.34909 13.5334 8.86576L19.1167 3.28242C19.6001 2.79909 20.4001 2.79909 20.8834 3.28242L26.4667 8.86576C26.9501 9.34909 26.9501 10.1491 26.4667 10.6324C26.2334 10.8824 25.9001 10.9991 25.5834 10.9991Z" fill="currentColor"/>
  </svg>
)

export const DocumentTextOutlineIcon: AppIconComponent = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M25.0002 37.9173H15.0002C5.95016 37.9173 2.0835 34.0506 2.0835 25.0007V15.0007C2.0835 5.95065 5.95016 2.08398 15.0002 2.08398H23.3335C24.0168 2.08398 24.5835 2.65065 24.5835 3.33398C24.5835 4.01732 24.0168 4.58398 23.3335 4.58398H15.0002C7.31683 4.58398 4.5835 7.31732 4.5835 15.0007V25.0007C4.5835 32.684 7.31683 35.4173 15.0002 35.4173H25.0002C32.6835 35.4173 35.4168 32.684 35.4168 25.0007V16.6673C35.4168 15.984 35.9835 15.4173 36.6668 15.4173C37.3502 15.4173 37.9168 15.984 37.9168 16.6673V25.0007C37.9168 34.0506 34.0502 37.9173 25.0002 37.9173Z" fill="currentColor"/>
    <path d="M36.6668 17.9168H30.0002C24.3002 17.9168 22.0835 15.7001 22.0835 10.0001V3.33348C22.0835 2.83348 22.3835 2.36681 22.8502 2.18348C23.3168 1.98348 23.8502 2.10014 24.2168 2.45014L37.5502 15.7835C37.9002 16.1335 38.0168 16.6835 37.8168 17.1501C37.6168 17.6168 37.1668 17.9168 36.6668 17.9168ZM24.5835 6.35014V10.0001C24.5835 14.3001 25.7002 15.4168 30.0002 15.4168H33.6502L24.5835 6.35014Z" fill="currentColor"/>
    <path d="M21.6665 22.916H11.6665C10.9832 22.916 10.4165 22.3493 10.4165 21.666C10.4165 20.9827 10.9832 20.416 11.6665 20.416H21.6665C22.3498 20.416 22.9165 20.9827 22.9165 21.666C22.9165 22.3493 22.3498 22.916 21.6665 22.916Z" fill="currentColor"/>
    <path d="M18.3332 29.584H11.6665C10.9832 29.584 10.4165 29.0173 10.4165 28.334C10.4165 27.6507 10.9832 27.084 11.6665 27.084H18.3332C19.0165 27.084 19.5832 27.6507 19.5832 28.334C19.5832 29.0173 19.0165 29.584 18.3332 29.584Z" fill="currentColor"/>
  </svg>
)

export const DocumentFileIcon: AppIconComponent = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 22C4.89617 22 4 21.1038 4 20V4C4 2.89617 4.89617 2 6 2H14C14.6394 1.99897 15.2527 2.25309 15.704 2.706L19.292 6.294C19.7461 6.74545 20.001 7.35966 20 8V20C20 21.1038 19.1038 22 18 22H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V7C14 7.55192 14.4481 8 15 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export {
  Sms as MailIcon,
  Lock1 as LockIcon,
  Eye as EyeIcon,
  EyeSlash as EyeSlashIcon,
  ArrowDown2 as ChevronDownIcon,
  Global as GlobeIcon,
  User as UserIcon,
  UserOctagon as UserOctagonIcon,
  Location as MapPinIcon,
  PictureFrame as LegalCapacityIcon,
  Call as PhoneIcon,
  DocumentText as FileTextIcon,
  Scroll as EntityDocumentIcon,
  TickCircle as SuccessCircleIcon,
  CloseCircle as ErrorCircleIcon,
  Category as DashboardIcon,
  RowVertical as MenuRowsIcon,
  SearchNormal as SearchIcon,
  Profile2User as UsersIcon,
  Wallet as WalletIcon,
  ShieldTick as ShieldIcon,
  Refresh2 as RefreshIcon,
  ReceiptItem as ReceiptIcon,
  Setting2 as SettingsIcon,
  SidebarLeft as SidebarLeftIcon,
  SidebarRight as SidebarRightIcon,
  Logout as LogoutIcon,
  Notification as NotificationIcon,
  MessageEdit as FeedbackIcon,
  Export as ExportIcon,
  ExportSquare as ExternalLinkIcon,
  Import as DownloadIcon,
  Edit2 as EditIcon,
  Element3 as FieldIcon,
  Judge as AccreditationFieldIcon,
  Check as ChecklistIcon,
  BoxSearch as FileReviewIcon,
  Monitor as DocumentReviewIcon,
  Warning2 as CorrectiveActionIcon,
  Document as FinalReportIcon,
  ClipboardText as ReportIcon,
  TaskSquare as TaskSquareIcon,
  Paperclip2 as AttachIcon,
  Link21 as LinkIcon,
  TextBold as BoldIcon,
  Text as TextIcon,
  Buildings as BuildingsIcon,
  LocationAdd as LocationAddIcon,
  AddCircle as AddCircleIcon,
}
