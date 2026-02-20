#!/bin/bash
# Jarvis-Board Quick Setup for Mac/Linux

echo "🤖 Jarvis-Board Setup"
echo "======================"
echo ""

# Check prerequisites
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed"; exit 1; }
command -v gh >/dev/null 2>&1 && echo "✅ GitHub CLI found" || echo "⚠️ GitHub CLI not found"

echo ""
echo "📋 Step 1: Create GitHub Repository"
echo "-----------------------------------"
echo "1. Go to: https://github.com/new"
echo "2. Name: jarvis-board"
echo "3. Select: Private"
echo "4. Copy the URL after creating"
echo ""

read -p "Paste GitHub repo URL: " REPO_URL

echo ""
echo "📤 Step 2: Push to GitHub"
echo "---------------------------"
git remote add origin $REPO_URL
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Repository pushed."
echo ""
echo "📦 Next: Deploy to Vercel"
echo "--------------------------"
echo "1. Go to: https://vercel.com"
echo "2. Import: jarvis-board"
echo "3. Add env vars:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "   - AUTH_PASSWORD=jarvis2026"
echo "4. Deploy!"
echo ""
echo "🗄️ Then run supabase_schema.sql in Supabase SQL Editor"
