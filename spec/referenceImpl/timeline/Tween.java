import spec.Point;

public abstract class Tween<T> {

    public TimeBand band;

    public abstract void apply(double time, Element element);

    public static class Translate extends Tween<Point> {
        public Point a, b;

        public Translate(Point from, Point to, TimeBand band) {
            this.a = from;
            this.b = to;
            this.band = band;
        }

        @Override
        public void apply(double time, Element element) {
            element.position = new Point((int) ((b.x-a.x)*band.t(time))+a.x, (int) ((b.y-a.y)*band.t(time))+a.y);
        }
    }
}
