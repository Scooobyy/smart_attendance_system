import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightOnRectangleIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  MoonIcon,
  PencilIcon,
  PhoneIcon,
  SunIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ProfileMenu = ({ user, stats, onLogout, onUpdateProfile }) => {
  const userStorageId = user?.id ? String(user.id) : user?.email || 'guest';
  const phoneStorageKey = `attendance_profile_phone_${userStorageId}`;
  const imageStorageKey = `attendance_profile_image_${userStorageId}`;
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('attendance_theme') || 'dark');
  const savedThemeRef = useRef(localStorage.getItem('attendance_theme') || 'dark');
  const [pendingProfileImage, setPendingProfileImage] = useState(() => localStorage.getItem(imageStorageKey) || '');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: localStorage.getItem(phoneStorageKey) || '',
    currentPassword: '',
    newPassword: '',
  });
  const menuRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem('attendance_profile_phone');
    localStorage.removeItem('attendance_profile_image');
  }, []);

  useEffect(() => {
    setPendingProfileImage(localStorage.getItem(imageStorageKey) || '');
    setFormData((current) => ({
      ...current,
      name: user?.name || '',
      email: user?.email || '',
      phone: localStorage.getItem(phoneStorageKey) || '',
    }));
  }, [imageStorageKey, phoneStorageKey, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.toggle('light', savedThemeRef.current === 'light');
    };
  }, []);

  const initials = useMemo(() => {
    const name = user?.name || user?.email || 'User';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not available';

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setSavedMessage('');

    const result = await onUpdateProfile({
      name: formData.name,
      email: formData.email,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      setSaving(false);
      return;
    }

    localStorage.setItem(phoneStorageKey, formData.phone);
    localStorage.setItem('attendance_theme', theme);
    savedThemeRef.current = theme;
    localStorage.setItem(imageStorageKey, pendingProfileImage);
    setFormData((current) => ({ ...current, currentPassword: '', newPassword: '' }));
    setSavedMessage('Profile updated successfully');
    setSaving(false);
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const statisticItems = [
    { label: 'Classrooms', value: stats?.totalClassrooms ?? 0 },
    { label: 'Students', value: stats?.totalStudents ?? 0 },
    { label: 'Attendance', value: `${stats?.todayAttendance ?? 0}%` },
    { label: 'Joined', value: createdAt },
  ];

  return (
    <div className="relative z-[100]" ref={menuRef}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-white/5 px-3 py-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        title="Profile"
      >
        <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-gray-gray flex items-center justify-center text-sm font-bold text-white">
          {pendingProfileImage ? (
            <img src={pendingProfileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">
          {user?.name || 'Profile'}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute right-0 top-14 z-[100] w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-700/70 bg-black/95 shadow-glow backdrop-blur-xl"
          >
            <div className="max-h-[78vh] overflow-y-auto p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="group relative block h-16 w-16 cursor-pointer overflow-hidden rounded-full bg-gradient-gray-gray">
                    {pendingProfileImage ? (
                      <img src={pendingProfileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  <div>
                    <h2 className="text-lg font-bold text-white">{user?.name || 'Your Profile'}</h2>
                    <p className="max-w-56 truncate text-sm text-slate-400">{user?.email || 'No email found'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Close profile"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                {statisticItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-800 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-1 truncate text-lg font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <UserCircleIcon className="h-5 w-5" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <label className="relative block">
                      <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <input name="name" value={formData.name} onChange={handleFieldChange} className="input pl-11" placeholder="Name" />
                    </label>
                    <label className="relative block">
                      <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <input name="email" value={formData.email} onChange={handleFieldChange} className="input pl-11" placeholder="Email" />
                    </label>
                    <label className="relative block">
                      <PhoneIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                      <input name="phone" value={formData.phone} onChange={handleFieldChange} className="input pl-11" placeholder="Phone number (optional)" />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <KeyIcon className="h-5 w-5" />
                    Account Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input name="currentPassword" type="password" value={formData.currentPassword} onChange={handleFieldChange} className="input" placeholder="Current password" />
                    <input name="newPassword" type="password" value={formData.newPassword} onChange={handleFieldChange} className="input" placeholder="New password" />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-200">Preferences</h3>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <MoonIcon className="h-5 w-5 text-slate-300" /> : <SunIcon className="h-5 w-5 text-slate-300" />}
                      <span className="text-sm font-medium text-white">Theme</span>
                    </div>
                    <button
                      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </section>

                {savedMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    <CheckIcon className="h-5 w-5" />
                    {savedMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-1">
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                    <PencilIcon className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={onLogout} className="btn btn-secondary flex items-center gap-2">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Logout
                  </button>
                </div>

                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  {confirmDelete ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-red-300">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Confirm account deletion?
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onLogout} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400">
                          Delete Account
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm font-semibold text-red-300 hover:text-red-200">
                      <TrashIcon className="h-5 w-5" />
                      Delete account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
