package app.tcoaal.browserplayer

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.File

/**
 * A thin, durable browser for https://tcoaal.app.
 *
 * Why a WebView wrapper instead of a PWA/TWA: the WebView's storage lives in this
 * app's private sandbox (app_webview/), so it is never subject to browser storage
 * eviction (Chrome pressure, Safari ITP). The only durability gap left - surviving
 * a factory reset - is closed by mirroring saves to a tiny native file that rides
 * Android Auto Backup (see SaveStore / SaveBridge / assets/save-sync.js).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var saveStore: SaveStore
    private val mainHandler = Handler(Looper.getMainLooper())

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var fileChooser: ActivityResultLauncher<Intent>

    private val periodicExport = object : Runnable {
        override fun run() {
            exportSaves()
            mainHandler.postDelayed(this, EXPORT_INTERVAL_MS)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        saveStore = SaveStore(File(filesDir, SaveStore.FILE_NAME))

        fileChooser = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val cb = filePathCallback
            filePathCallback = null
            cb?.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            )
        }

        webView = WebView(this)
        setContentView(webView)
        configureWebView()
        enableServiceWorkers()

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.addJavascriptInterface(
            SaveBridge(saveStore) { json -> restoreSaves(json) },
            "AndroidSaveBridge"
        )

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url?.toString()
                if (UrlPolicy.isInternal(url)) return false
                url?.let { openExternally(it) }
                return true
            }

            override fun onPageFinished(view: WebView, url: String?) {
                injectSaveSync()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            // The game's www/ is imported as a .zip via the loader's file input.
            // (Folder import uses webkitdirectory, which Android WebView cannot
            // satisfy - users must pick the .zip on mobile.)
            override fun onShowFileChooser(
                webView: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                return try {
                    fileChooser.launch(params.createIntent())
                    true
                } catch (e: Exception) {
                    filePathCallback = null
                    false
                }
            }
        }
    }

    /** The asset-decryption pipeline relies on a service worker; make sure the
     *  WebView's SW engine is active and may read app content. */
    private fun enableServiceWorkers() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) return
        val controller = ServiceWorkerControllerCompat.getInstance()
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_CONTENT_ACCESS)) {
            controller.serviceWorkerWebSettings.allowContentAccess = true
        }
        controller.setServiceWorkerClient(object : ServiceWorkerClientCompat() {
            override fun shouldInterceptRequest(request: WebResourceRequest) = null
        })
    }

    private fun injectSaveSync() {
        val js = try {
            assets.open("save-sync.js").bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            return
        }
        webView.evaluateJavascript(js, null)
    }

    private fun exportSaves() {
        if (!::webView.isInitialized) return
        webView.evaluateJavascript(
            "window.__nativeSaveSync && window.__nativeSaveSync.export();",
            null
        )
    }

    private fun restoreSaves(json: String) {
        // Invoked from the JS bridge thread; evaluateJavascript must run on main.
        mainHandler.post {
            val literal = JSONObject.quote(json) // safe, escaped JS string literal
            webView.evaluateJavascript(
                "window.__nativeSaveSync && window.__nativeSaveSync.import($literal);",
                null
            )
        }
    }

    private fun openExternally(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            // No handling app; silently ignore.
        }
    }

    override fun onResume() {
        super.onResume()
        mainHandler.postDelayed(periodicExport, EXPORT_INTERVAL_MS)
    }

    override fun onPause() {
        mainHandler.removeCallbacks(periodicExport)
        exportSaves()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        mainHandler.removeCallbacksAndMessages(null)
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        const val START_URL = "https://tcoaal.app/"
        const val EXPORT_INTERVAL_MS = 60_000L
    }
}
