import React, { useEffect, useRef } from 'react';

const VideoFeed = () => {
  const videoRef = useRef(null);

  console.log('Llamando a Video Feed');

  useEffect(() => {
    const fetchVideoFeed = async () => {
      try {
        const response = await fetch('http://192.168.68.105:8999/video_feed');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        console.log('response:', response);

        const stream = new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                push();
              });
            }
            push();
          }
        });

        const videoUrl = 'http://192.168.1.9:8999/video_feed';
        if (videoRef.current) {
          videoRef.current.src = videoUrl;
        }
        console.log('videoRef:', videoRef);
        console.log('stream', stream);
        console.log('videoURL', videoUrl);
      } catch (error) {
        console.error('Failed to fetch video feed:', error);
      }
    };

    fetchVideoFeed();

    return () => {
      if (videoRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  return (
    <div>
      <img ref={videoRef} alt="Video Feed" />
    </div>
  );
};

export default VideoFeed;

