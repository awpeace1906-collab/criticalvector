import Foundation

struct GuideManifest: Codable {
    let title: String
    let subtitle: String
    let groups: [NavGroup]
}

struct NavGroup: Codable, Identifiable, Hashable {
    let label: String
    let sections: [NavSection]
    var id: String { label }
}

struct NavSection: Codable, Identifiable, Hashable {
    let id: String
    let num: String
    let title: String
    let subsections: [NavSubsection]
}

struct NavSubsection: Codable, Identifiable, Hashable {
    let id: String
    let label: String
}

struct SectionMeta: Codable, Identifiable, Hashable {
    let id: String
    let num: String
    let title: String
    let desc: String
}
