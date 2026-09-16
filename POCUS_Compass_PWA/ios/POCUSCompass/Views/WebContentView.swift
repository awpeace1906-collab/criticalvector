import SwiftUI
import WebKit

struct WebContentView: UIViewRepresentable {
    let sectionID: String
    @Binding var height: CGFloat
    @Binding var scrollTarget: String?

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.navigationDelegate = context.coordinator
        loadContent(into: webView)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.loadedSectionID != sectionID {
            loadContent(into: webView)
            context.coordinator.loadedSectionID = sectionID
        } else if let target = scrollTarget {
            context.coordinator.scrollTo(target, in: webView)
        }
    }

    private func loadContent(into webView: WKWebView) {
        guard let fileURL = DataStore.sectionFileURL(sectionID),
              let fragment = try? String(contentsOf: fileURL, encoding: .utf8) else {
            webView.loadHTMLString("<p style='color:#d4dbe8;font-family:-apple-system'>Content not found.</p>", baseURL: nil)
            return
        }
        // Images sit alongside the HTML at the bundle root (Xcode flattens the
        // content/ tree), so the fragment's ../images/ prefix has to go.
        let body = fragment.replacingOccurrences(of: "../images/", with: "")
        let css = DataStore.guideCSS()
        let html = """
        <!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
        \(css)
        html,body{background:transparent!important;margin:0;padding:0;-webkit-text-size-adjust:100%;}
        body{padding:2px 2px 24px;}
        </style>
        </head>
        <body>\(body)</body>
        </html>
        """
        let baseURL = fileURL.deletingLastPathComponent()
        webView.loadHTMLString(html, baseURL: baseURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let parent: WebContentView
        var loadedSectionID: String
        private var heightObservation: NSKeyValueObservation?

        init(_ parent: WebContentView) {
            self.parent = parent
            self.loadedSectionID = parent.sectionID
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            updateHeight(webView)
            heightObservation = webView.scrollView.observe(\.contentSize, options: [.new]) { [weak self] _, change in
                guard let newHeight = change.newValue?.height, newHeight > 0 else { return }
                DispatchQueue.main.async {
                    self?.parent.height = newHeight
                }
            }
            if let target = parent.scrollTarget {
                scrollTo(target, in: webView)
            }
        }

        func scrollTo(_ elementID: String, in webView: WKWebView) {
            let js = "document.getElementById('\(elementID)') ? document.getElementById('\(elementID)').getBoundingClientRect().top : -1"
            webView.evaluateJavaScript(js) { [weak self] result, _ in
                guard let self, let offsetTop = result as? CGFloat, offsetTop >= 0 else { return }
                guard let outerScroll = Self.findEnclosingScrollView(of: webView) else { return }
                let pointInWebView = CGPoint(x: 0, y: offsetTop)
                let pointInScroll = webView.convert(pointInWebView, to: outerScroll)
                let targetY = max(0, outerScroll.contentOffset.y + pointInScroll.y - 90)
                DispatchQueue.main.async {
                    outerScroll.setContentOffset(CGPoint(x: 0, y: targetY), animated: true)
                    self.parent.scrollTarget = nil
                }
            }
        }

        private static func findEnclosingScrollView(of view: UIView) -> UIScrollView? {
            var v: UIView? = view.superview
            while let current = v {
                if let scroll = current as? UIScrollView { return scroll }
                v = current.superview
            }
            return nil
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        private func updateHeight(_ webView: WKWebView) {
            webView.evaluateJavaScript("document.body.scrollHeight") { [weak self] result, _ in
                if let h = result as? CGFloat {
                    DispatchQueue.main.async { self?.parent.height = h }
                }
            }
        }
    }
}
