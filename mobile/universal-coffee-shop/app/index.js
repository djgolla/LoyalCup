//entry point of app, redirect to launch screen - test navigation here
// universal-coffee-shop/app/index.js
import { Redirect } from 'expo-router';

export default function StartPage() {
  return <Redirect href="/launch" />;
}