# ────────────────────────────────────────────────────────────────
# patch_ios_signing.rb
# Patches the Xcode App target with:
#  1. Provisioning profile settings (manual signing)
#  2. MARKETING_VERSION = Android version (from package.json)
#  3. CURRENT_PROJECT_VERSION = GITHUB_RUN_NUMBER (auto-incrementing)
# Standalone script — no more printf/escape hell in YAML workflows.
# ────────────────────────────────────────────────────────────────

require 'xcodeproj'
require 'json'

# Read version from package.json (SSOT, same as Android)
package_json = JSON.parse(File.read('../../package.json'))
marketing_version = package_json['version'] || '1.0.0'

# Build number from GITHUB_RUN_NUMBER (or fallback to date-based)
build_number = ENV['GITHUB_RUN_NUMBER'] || Time.now.strftime('%y%m%d') + '01'

puts "→ Marketing Version: #{marketing_version}"
puts "→ Build Number: #{build_number}"

project = Xcodeproj::Project.open('App.xcodeproj')
target = project.targets.find { |t| t.name == 'App' }

if target
  target.build_configurations.each do |config|
    # ── Signing ──
    config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = 'HUI App Store Profile'
    config.build_settings['CODE_SIGN_STYLE'] = 'Manual'
    config.build_settings['CODE_SIGN_IDENTITY'] = 'iPhone Distribution'
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    
    # ── Versioning ──
    config.build_settings['MARKETING_VERSION'] = marketing_version
    config.build_settings['CURRENT_PROJECT_VERSION'] = build_number
  end
  project.save
  puts "✅ App target patched: signing + version #{marketing_version} (build #{build_number})"
else
  puts 'ERROR: App target not found'
  exit 1
end
