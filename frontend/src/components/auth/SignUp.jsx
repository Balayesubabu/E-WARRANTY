import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Shield, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { IconInput } from '../ui/icon-input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AnimatedDiv } from '../ui/animated-div';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
// import { useUser } from '../../contexts/UserContext';
import { signup } from '../../services/authorizationService';
import { toast } from 'sonner';



export function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (value) => {
    if (value && value.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError('Please enter a valid email address');
        return false;
      }
    }
    setEmailError('');
    return true;
  };

  const COUNTRY_CODES = [
    { code: '+91', label: 'India (+91)' },
    { code: '+1', label: 'US / Canada (+1)' },
    { code: '+44', label: 'UK (+44)' },
    { code: '+61', label: 'Australia (+61)' },
    { code: '+81', label: 'Japan (+81)' },
    { code: '+971', label: 'UAE (+971)' },
    { code: '+65', label: 'Singapore (+65)' },
    { code: '+86', label: 'China (+86)' },
    { code: '+49', label: 'Germany (+49)' },
    { code: '+33', label: 'France (+33)' },
    { code: '+39', label: 'Italy (+39)' },
    { code: '+34', label: 'Spain (+34)' },
    { code: '+55', label: 'Brazil (+55)' },
    { code: '+52', label: 'Mexico (+52)' },
    { code: '+27', label: 'South Africa (+27)' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await signup({
        fullname: fullname,
        email: email,
        country_code: countryCode,
        phone_number: phoneNumber,
        password: password,
      });

      toast.success(response.message);
      console.log(response.message);

      navigate('/login');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Sign up failed';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
      <AnimatedDiv
        variant="fadeInUp"
        className="flex-1 flex flex-col justify-center space-y-8"
      >
        {/* Back button */}
        {/* <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button> */}

        <div className="text-center space-y-4">
          <AnimatedDiv
            variant="scaleIn"
            className={`w-20 h-20 mx-auto rounded-3xl bg-[#1A7FC1] flex items-center justify-center shadow-xl`}
          >
            <Shield className="w-10 h-10 text-white" strokeWidth={2} />
          </AnimatedDiv>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-600 mt-2">
              Join eWarranty and start managing warranties
            </p>
          </div>
        </div>

        {/* Sign up form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullname" className="text-slate-700">
              Full Name
            </Label>
            <IconInput
              id="fullname"
              type="text"
              icon={User}
              placeholder="Enter your full name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="h-14 rounded-xl border-slate-200"
              required
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="companyname" className="text-slate-700">
              Company Name
            </Label>
            <IconInput
              id="companyname"
              type="text"
              icon={Building2}
              placeholder="Enter your company name"
              value={companyname}
              onChange={(e) => setCompanyname(e.target.value)}
              className="h-14 rounded-xl border-slate-200"
            />
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-slate-700">
              Email
            </Label>
            <IconInput
              id="signup-email"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              className={`h-14 rounded-xl ${emailError ? 'border-red-400' : 'border-slate-200'}`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-phone" className="text-slate-700">
              Phone Number
            </Label>
            <div className="flex gap-2 items-stretch">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="h-14 min-h-14 w-[130px] rounded-xl border border-slate-200 bg-input-background px-3 shrink-0 [&[data-size=default]]:h-14">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map(({ code, label }) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 min-w-0">
                <IconInput
                  id="signup-phone"
                  type="tel"
                  icon={Phone}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 rounded-xl border-slate-200 w-full"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="signup-password" className="text-slate-700">
              Password
            </Label>
            <IconInput
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-xl border-slate-200 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[50px] -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
            <PasswordStrengthMeter password={password} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-[#1A7FC1] hover:to-[#0F4E78] text-white h-14 rounded-xl shadow-lg"
          >
            Create Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>
        {/* Login link */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Already have an account?  <button
              type="button"
              onClick={() => navigate("/login")}
              className={`text-[#1A7FC1] hover:opacity-80 transition-opacity font-medium`}
            >
              Login
            </button>
          </p>
          {/* Terms */}
          <p className="text-center text-slate-500 text-sm">
            By creating an account, you agree to our{" "}
            <Link to={`/terms-of-service?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to={`/privacy-policy?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Privacy Policy</Link>
          </p>
        </div>


      </AnimatedDiv>
    </div>
  );
}