# ---- Standard-Kommentare (kann bleiben) ----
# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# ---- Capacitor & Core ----
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# ---- Capacitor Plugins ----
-keep class com.getcapacitor.plugin.** { *; }

# ---- Cordova Plugins ----
-keep class org.apache.cordova.** { *; }

# ---- Supabase ----
-keep class io.supabase.** { *; }

# ---- WebView JS Bridge ----
-keepclassmembers class * {
    @android.webkit.JavascriptInterface *;
}

# ---- Prevent stripping of JS interfaces ----
-keep class * implements android.webkit.JavascriptInterface { *; }

# ---- Keep line numbers for debugging (optional) ----
-keepattributes SourceFile,LineNumberTable
