import { UserMenu } from '@/components/UserMenu';
import { HomeClient } from './HomeClient';

export default function Home() {
  return <HomeClient userMenu={<UserMenu />} />;
}
