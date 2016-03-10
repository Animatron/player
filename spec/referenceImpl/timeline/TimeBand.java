public class TimeBand {

    public double start;
    public double end;

    public TimeBand(double start, double end) {
        this.start = start;
        this.end = end;
    }

    public TimeBand(double start) {
        this.start = start;
        this.end = 1E20;
    }

    public boolean isInfinite() {
        return end > 1e19;
    }

    public double t(double time) {
        return (time-start) / (end - start);
    }

    public double length() {
        return end-start;
    }

    public TimeBand relative() {
        return new TimeBand(0, length());
    }

    public boolean contains(double time) {
        return start<=time && time<=end;
    }

    public boolean containsOpen(double time) {
        return start<=time && time<end;
    }

    public TimeBand union(TimeBand band) {
        return new TimeBand(Math.min(start, band.start), Math.max(end, band.end));
    }

    @Override
    public String toString() {
        return "band["+start+","+end+"]";
    }

}
