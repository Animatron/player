import spec.Point;

import java.util.ArrayList;
import java.util.List;

public class Element {

    public String name;

    public EndAction end = new EndAction(EndAction.Type.ONCE);
    public TimeBand band = new TimeBand(0);
    public boolean visible = true;

    public List<Tween> tweens = new ArrayList<>();

    public Clip parent;

    public Point position;

    public Element(String name) {
        this.name = name;
    }

    public Element(String name, TimeBand band) {
        this.name = name;
        this.band = band;
    }

    public Element(String name, TimeBand band, EndAction end) {
        this.name = name;
        this.band = band;
        this.end = end;
    }

    protected int step(int deltaTicks) {
        return deltaTicks;
    }

    public void tick(double delta) {
    }

    protected void tickStep(int step, double newTime) {
        runTweens(newTime);
    }

    protected void runTweens(double time) {
        for (Tween tween : tweens) {
            tween.apply(time, this);
        }
    }

    public static int toTicks(double seconds) {
        return (int) (seconds*1000);
    }

    public static double fromTicks(int ticks) {
        return ticks/1000.0;
    }

    public TimeBand getEffectiveBand() {
        TimeBand effBand = band;

        if (end.isRepeating()) {
            if (end.counter == 0 || end.stay) {
                return new TimeBand(band.start);
            } else {
                return new TimeBand(band.start, band.start + band.length() * end.counter);
            }
        }

        return effBand;
    }

    public boolean isPresentAtTime(double time) {
        if (isInRepeatingGroup()) {
            return band.contains(parent.band.start + parent.timeToTweenTime(time));
        } else {
            return getEffectiveBand().contains(time);
        }
    }

    protected boolean isInGroup() {
        return parent != null && parent.isGroup();
    }

    protected boolean isInRepeatingGroup() {
        return parent != null && parent.isGroup() && parent.end.isRepeating();
    }

    protected double timeToTweenTime(double time) {
        double offset = time - band.start;

        // if this element is part of a group which has repeating end action
        // then we just return the group's tweentime, it's the same as for its children
        if (isInRepeatingGroup()) {
            return parent.timeToTweenTime(time);
        } else {
            switch (end.type) {
                case LOOP:
                    return band.contains(time) ? offset : offset % band.length();
                case BOUNCE: {
                    double length = band.length();
                    int n = (int) (offset / length);
                    double t = offset - length * n;

                    if (n % 2 == 0) return t;
                    else return length - t;
                }
                default:
                    return offset;
            }
        }
    }

    public void addTranslate(Point p0, Point p1) {
        add(new Tween.Translate(p0, p1, band));
    }

    public void add(Tween tween) {
        tweens.add(tween);
    }

    public boolean isGroup() {
        return false;
    }

    @Override
    public String toString() {
        return "element["+name+"]";
    }
}
