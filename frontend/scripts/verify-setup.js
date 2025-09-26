const fs = require("fs")
const path = require("path")

console.log("🔍 Verifying Shop Validation Dashboard Setup...\n")

// Check if we're in the frontend directory
const currentDir = process.cwd()
const packageJsonPath = path.join(currentDir, "package.json")

if (!fs.existsSync(packageJsonPath)) {
  console.log("❌ package.json not found!")
  console.log("📁 Current directory:", currentDir)
  console.log("\n💡 Make sure you are in the frontend directory:")
  console.log("   cd frontend")
  console.log("   npm run verify")
  process.exit(1)
}

// Check package.json content
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  if (packageJson.name !== "shop-validation-dashboard") {
    console.log("⚠️  Warning: package.json name doesn't match expected project name")
  } else {
    console.log("✅ package.json found and verified")
  }
} catch (error) {
  console.log("❌ Error reading package.json:", error.message)
  process.exit(1)
}

// Check required directories
const requiredDirs = ["app", "components", "hooks", "lib"]
const missingDirs = []

requiredDirs.forEach((dir) => {
  const dirPath = path.join(currentDir, dir)
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/ directory found`)
  } else {
    console.log(`❌ ${dir}/ directory missing`)
    missingDirs.push(dir)
  }
})

// Check key files
const requiredFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/login/page.tsx",
  "components/auth-provider.tsx",
  "lib/utils.ts",
  "lib/auth.ts",
  "tailwind.config.js",
  "next.config.mjs",
  "tsconfig.json",
]

const missingFiles = []

requiredFiles.forEach((file) => {
  const filePath = path.join(currentDir, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} found`)
  } else {
    console.log(`❌ ${file} missing`)
    missingFiles.push(file)
  }
})

// Check .env.local
const envPath = path.join(currentDir, ".env.local")
if (fs.existsSync(envPath)) {
  console.log("✅ .env.local found")

  // Check if it has content
  const envContent = fs.readFileSync(envPath, "utf8").trim()
  if (envContent.length === 0) {
    console.log("⚠️  .env.local is empty - you need to add your API base URL")
    console.log("   Add: NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com")
  } else {
    console.log("✅ .env.local has content")
  }
} else {
  console.log("⚠️  .env.local not found - create it with your API base URL")
  console.log("   Create: NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com")
}

// Summary
console.log("\n📋 Setup Summary:")
if (missingDirs.length === 0 && missingFiles.length === 0) {
  console.log("🎉 All required files and directories are present!")
  console.log("\n🚀 Next steps:")
  console.log("   1. Configure .env.local with your API URL")
  console.log("   2. Run: npm install")
  console.log("   3. Run: npm run dev")
  console.log("   4. Visit: http://localhost:3000")
} else {
  console.log("❌ Setup incomplete!")
  if (missingDirs.length > 0) {
    console.log("   Missing directories:", missingDirs.join(", "))
  }
  if (missingFiles.length > 0) {
    console.log("   Missing files:", missingFiles.join(", "))
  }
  console.log("\n💡 This might mean files were extracted outside the frontend folder.")
  console.log("   Please ensure all app/, components/, hooks/, lib/ folders are in the frontend directory.")
}

console.log("\n📁 Current working directory:", currentDir)
console.log("📁 Expected to be in: .../shop-validation-dashboard/frontend")
