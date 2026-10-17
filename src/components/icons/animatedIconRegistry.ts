// Lazy chunk: the Animate UI icons (and `motion`) load from here only after
// the page is idle, so they never enter the initial bundle. Keys must match
// `AnimatedIconName` in ./AnimatedIcon. The icon sources are vendored under
// src/components/animate-ui — nothing is fetched from animate-ui.com.
import { ArrowRight } from '@/components/animate-ui/icons/arrow-right';
import { Check } from '@/components/animate-ui/icons/check';
import { ChevronDown } from '@/components/animate-ui/icons/chevron-down';
import { ChevronLeft } from '@/components/animate-ui/icons/chevron-left';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { Heart } from '@/components/animate-ui/icons/heart';
import { LogIn } from '@/components/animate-ui/icons/log-in';
import { LogOut } from '@/components/animate-ui/icons/log-out';
import { Menu } from '@/components/animate-ui/icons/menu';
import { MessageCircle } from '@/components/animate-ui/icons/message-circle';
import { Plus } from '@/components/animate-ui/icons/plus';
import { Search } from '@/components/animate-ui/icons/search';
import { Send } from '@/components/animate-ui/icons/send';
import { Sparkles } from '@/components/animate-ui/icons/sparkles';
import { Star } from '@/components/animate-ui/icons/star';
import { Trash2 } from '@/components/animate-ui/icons/trash-2';
import { User } from '@/components/animate-ui/icons/user';
import { X } from '@/components/animate-ui/icons/x';

export const animatedIcons = {
  'arrow-right': ArrowRight,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  heart: Heart,
  'log-in': LogIn,
  'log-out': LogOut,
  menu: Menu,
  'message-circle': MessageCircle,
  plus: Plus,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  star: Star,
  'trash-2': Trash2,
  user: User,
  x: X,
};
