import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, KeyRound } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { toast } from 'sonner';
import { changeServiceCenterPassword } from '../../services/serviceCenterService';
import Cookies from 'js-cookie';

export function ServiceCenterChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setIsLoading(true);
      const res = await changeServiceCenterPassword(oldPassword, newPassword);
      const newToken = res?.data?.token;
      if (newToken) {
        Cookies.set('authToken', newToken, { expires: 7 });
        localStorage.setItem('token', newToken);
      }
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/service-center/profile'), 1000);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#1A7FC1]" />
            Change Password
          </h2>
          <p className="text-slate-500 text-sm mt-1">Update your service center account password</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="old-password">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="old-password"
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword && (
                <div className="flex items-center gap-1 mt-1">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-xs">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-red-500 text-xs">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" /> Change Password
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-amber-700 text-sm">
            After changing your password, you will stay logged in. Use the new password for your next login.
          </p>
        </div>
      </div>
    </div>
  );
}
