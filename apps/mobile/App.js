// Bridge file for web bundling compatibility
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

renderRootComponent(App);

export default App;
