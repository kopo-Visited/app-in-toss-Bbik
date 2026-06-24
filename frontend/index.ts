// 앱 진입점. SDK 2.x에서 src/_app 의 registerApp 은 App 컴포넌트를 "반환"만 하고,
// 실제 AppRegistry 등록(runnable)은 @granite-js/react-native 의 register() 가 수행한다.
// (공식 create-granite-app 템플릿과 동일 패턴 — register 누락 시 "Invariant ... runnables" 에러)
import { register } from '@granite-js/react-native';
import App from './src/_app';

register(App);
