/**
 * Fixtures shaped exactly like real https://kenney.nl/feed items (verified
 * against the live public feed, 2026-07). Tests must never depend on the
 * live network — this file (plus a couple of hand-built malformed variants)
 * is the contract.
 */

export const VALID_ITEM_3D = `
		<item>
			<title>Modular Cave Kit</title>
			<link>https://kenney.nl/assets/modular-cave-kit</link>
			<guid isPermaLink="false">modular-cave-kit</guid>
			<pubDate>Fri, 10 Jul 2026 00:00:00 +0000</pubDate>
			<category>3D</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/modular-cave-kit/98586b397d-1783667086/preview.png" />

			<description>

				<![CDATA[This 3D pack is part of the 'Modular' series and contains 40 files. It is tagged as: tiles, modular, cave]]>

			</description>
		</item>
`;

export const VALID_ITEM_2D = `
		<item>
			<title>Input Prompts</title>
			<link>https://kenney.nl/assets/input-prompts</link>
			<guid isPermaLink="false">input-prompts</guid>
			<pubDate>Sat, 11 Jul 2026 00:00:00 +0000</pubDate>
			<category>2D</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/input-prompts/521ca9b941-1744026983/preview-xbox-series.png" />

			<description>

				<![CDATA[This 2D pack is part of the 'Input Prompts' series and contains 1500 files. It is tagged as: input, prompt, button, gamepad, control, interface]]>

			</description>
		</item>
`;

export const VALID_ITEM_TEXTURES = `
		<item>
			<title>Skyboxes</title>
			<link>https://kenney.nl/assets/skyboxes</link>
			<guid isPermaLink="false">skyboxes</guid>
			<pubDate>Wed, 15 Jul 2026 00:00:00 +0000</pubDate>
			<category>Textures</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/skyboxes/30f1f43340-1784123464/preview.png" />

			<description>

				<![CDATA[This Textures pack contains 5 files. It is tagged as: skybox, sky, clouds, space, stars]]>

			</description>
		</item>
`;

/** No <enclosure> at all — must be rejected, never shown without a real preview image. */
export const MALFORMED_MISSING_ENCLOSURE = `
		<item>
			<title>Broken Pack</title>
			<link>https://kenney.nl/assets/broken-pack</link>
			<guid isPermaLink="false">broken-pack</guid>
			<pubDate>Wed, 15 Jul 2026 00:00:00 +0000</pubDate>
			<category>3D</category>

			<description>

				<![CDATA[This 3D pack contains 1 files. It is tagged as: broken]]>

			</description>
		</item>
`;

/** Link not on the trusted kenney.nl/assets/ prefix — must be rejected. */
export const MALFORMED_UNTRUSTED_LINK = `
		<item>
			<title>Suspicious Pack</title>
			<link>https://evil.example.com/assets/suspicious-pack</link>
			<guid isPermaLink="false">suspicious-pack</guid>
			<pubDate>Wed, 15 Jul 2026 00:00:00 +0000</pubDate>
			<category>3D</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/suspicious-pack/preview.png" />

			<description>

				<![CDATA[This 3D pack contains 1 files. It is tagged as: suspicious]]>

			</description>
		</item>
`;

/** Image enclosure not on the trusted kenney.nl/media/ prefix — must be rejected. */
export const MALFORMED_UNTRUSTED_IMAGE_HOST = `
		<item>
			<title>Untrusted Image Pack</title>
			<link>https://kenney.nl/assets/untrusted-image-pack</link>
			<guid isPermaLink="false">untrusted-image-pack</guid>
			<pubDate>Wed, 15 Jul 2026 00:00:00 +0000</pubDate>
			<category>3D</category>

			<enclosure type="image/png" length="0" url="https://evil.example.com/preview.png" />

			<description>

				<![CDATA[This 3D pack contains 1 files. It is tagged as: untrusted]]>

			</description>
		</item>
`;

/** Unparseable pubDate — must be rejected rather than silently defaulting to "now". */
export const MALFORMED_BAD_DATE = `
		<item>
			<title>Undated Pack</title>
			<link>https://kenney.nl/assets/undated-pack</link>
			<guid isPermaLink="false">undated-pack</guid>
			<pubDate>not-a-real-date</pubDate>
			<category>3D</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/undated-pack/preview.png" />

			<description>

				<![CDATA[This 3D pack contains 1 files. It is tagged as: undated]]>

			</description>
		</item>
`;

/** Missing title entirely — must be rejected. */
export const MALFORMED_MISSING_TITLE = `
		<item>
			<link>https://kenney.nl/assets/untitled-pack</link>
			<guid isPermaLink="false">untitled-pack</guid>
			<pubDate>Wed, 15 Jul 2026 00:00:00 +0000</pubDate>
			<category>3D</category>

			<enclosure type="image/png" length="0" url="https://kenney.nl/media/pages/assets/untitled-pack/preview.png" />

			<description>

				<![CDATA[This 3D pack contains 1 files. It is tagged as: untitled]]>

			</description>
		</item>
`;

export function feedXml(...items: readonly string[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
	<channel>
		<title>Latest game assets</title>
		<link>https://kenney.nl/feed/</link>
		<description>Latest Kenney game asset releases and updates</description>
		<category>Game Development</category>
		${items.join("\n")}
	</channel>
</rss>`;
}
