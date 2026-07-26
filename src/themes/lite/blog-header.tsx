import MusicPlayerApple from "@/components/music-player-apple";
import type { Song } from "@/hooks/use-music-player";

const headerSong: Song = {
  name: "Dust In The Wind",
  artists: ["Kansas"],
  album: { name: "Point of Know Return", image: "/images/avatar.png" },
  duration: 206,
};

export function BlogHeader({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <section className="handsome-blog-header">
      <div className="lite-blog-heading">
        <h1>{name}</h1>
        <p className="handsome-blog-description">人生如逆旅，我亦是行人。</p>
        <span className="lite-blog-description">{description}</span>
      </div>
      <div className="lite-blog-music-player">
        <MusicPlayerApple song={headerSong} />
      </div>
    </section>
  );
}
