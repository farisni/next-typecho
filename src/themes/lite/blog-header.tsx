import MusicPlayerApple from "@/components/music-player-apple";
import type { Song } from "@/hooks/use-music-player";

const headerSong: Song = {
  name: "山阴路的夏天",
  artists: ["李志"],
  album: {
    name: "2014 i/O",
    image: "/images/shanyin-road-summer-2014-cover.jpg",
  },
  src: "/audio/shanyin-road-summer-2014.mp3",
  duration: 313,
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
