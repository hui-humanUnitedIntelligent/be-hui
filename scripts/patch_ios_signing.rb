require 'xcodeproj'
project = Xcodeproj::Project.open('App.xcodeproj')
target = project.targets.find { |t| t.name == 'App' }
if target
  target.build_configurations.each do |config|
    config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = 'HUI App Store Profile'
    config.build_settings['CODE_SIGN_STYLE'] = 'Manual'
    config.build_settings['CODE_SIGN_IDENTITY'] = 'iPhone Distribution'
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
  end
  project.save
  puts 'App target patched with provisioning profile'
else
  puts 'ERROR: App target not found'
  exit 1
end
