import Foundation
import SwiftUI

@MainActor
final class DataStore: ObservableObject {
    @Published var manifest: GuideManifest?
    @Published var sectionsMeta: [SectionMeta] = []
    @Published var sectionOrder: [String] = []

    private var metaByID: [String: SectionMeta] = [:]

    init() {
        load()
    }

    private func load() {
        manifest = Self.decode(GuideManifest.self, resource: "manifest")
        sectionsMeta = Self.decode([SectionMeta].self, resource: "sections_meta") ?? []
        metaByID = Dictionary(uniqueKeysWithValues: sectionsMeta.map { ($0.id, $0) })
        sectionOrder = sectionsMeta.map { $0.id }
    }

    func meta(for id: String) -> SectionMeta? {
        metaByID[id]
    }

    func navSection(for id: String) -> NavSection? {
        manifest?.groups.flatMap { $0.sections }.first { $0.id == id }
    }

    func neighbors(of id: String) -> (prev: SectionMeta, next: SectionMeta)? {
        guard let idx = sectionOrder.firstIndex(of: id), !sectionOrder.isEmpty else { return nil }
        let prevIdx = (idx - 1 + sectionOrder.count) % sectionOrder.count
        let nextIdx = (idx + 1) % sectionOrder.count
        guard let prev = metaByID[sectionOrder[prevIdx]], let next = metaByID[sectionOrder[nextIdx]] else { return nil }
        return (prev, next)
    }

    /// Xcode's Copy Bundle Resources phase flattens the content/ tree, so every
    /// file lands at the bundle root rather than under content/sections/ etc.
    /// Filenames are globally unique (sNN.html, sNN-M.ext), so a flat lookup is safe.
    static func sectionFileURL(_ id: String) -> URL? {
        Bundle.main.url(forResource: id, withExtension: "html")
    }

    static func guideCSS() -> String {
        ["guide", "mobile"].compactMap { name -> String? in
            guard let url = Bundle.main.url(forResource: name, withExtension: "css") else { return nil }
            return try? String(contentsOf: url, encoding: .utf8)
        }.joined(separator: "\n")
    }

    private static func decode<T: Decodable>(_ type: T.Type, resource: String) -> T? {
        guard let url = Bundle.main.url(forResource: resource, withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}
