#!/bin/bash

# Elite Store - Git Setup Script
echo "🚀 البدء في إعداد المستودع لمتجر النخبة..."

git init
git add .
git commit -m "Initial commit: Elite Store Full Version"
git branch -M main
git remote add origin https://github.com/yosersev-sys/-Elite-Store.git

echo "📦 جاري الرفع إلى GitHub..."
git push -u origin main

echo "✅ تم الانتهاء بنجاح! موقعك الآن موجود على GitHub."
