#!/bin/bash
# Test APK build — hafif mod, keystore gerekmez

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# nvm ile Node 20 aktif et
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 --silent

export ANDROID_HOME="/home/emir/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

echo "Node: $(node --version)"
echo "Test APK build başlıyor (debug mod)..."
echo "Build süresi ~10-15 dakika, PC donmaz."
echo ""

nice -n 15 ionice -c 3 bash --login -c "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && source \"\$NVM_DIR/nvm.sh\"
  nvm use 20 --silent
  export ANDROID_HOME='/home/emir/Android/Sdk'
  export PATH=\"\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/tools:\$PATH\"
  cd '$SCRIPT_DIR/android'
  ./gradlew assembleDebug \
    --no-daemon \
    --max-workers 2 \
    -PbundleInDebug=true \
    -Porg.gradle.jvmargs='-Xmx1024m -XX:MaxMetaspaceSize=256m'
"

BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  APK_PATH=$(find "$SCRIPT_DIR/android/app/build/outputs/apk/debug" -name "*.apk" | head -1)
  echo ""
  echo "APK hazır: $APK_PATH"
  cp "$APK_PATH" "$SCRIPT_DIR/wortkrieg-debug.apk" && echo "Kopyalandı: wortkrieg-debug.apk"
else
  echo "Build başarısız. Yukarıdaki hatayı kontrol et."
  exit 1
fi
