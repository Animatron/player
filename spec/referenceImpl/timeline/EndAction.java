public class EndAction {

    public static enum Type {
        ONCE,       // stop and hide
        LOOP,       // loop from the start
        BOUNCE;     // reverse
    }

    public final Type type;
    public final int counter;
    public final boolean stay; //for finite LOOP and BOUNCE action if stay is true layer will stay after repeats

    /**
     *
     * @param type ONCE, LOOP or BOUNCE
     * @param counter number of repeats, 0 means infinite repeating (for LOOP and BOUNCE only)
     * @param stay indicates whether layer should stay after repeats (for finite LOOP and BOUNCE only)
     */
    public EndAction(Type type, int counter, boolean stay) {
        this.type = type;
        this.counter = counter;
        this.stay = stay;
    }


    public EndAction(Type type, int counter) {
        this.type = type;
        this.counter = counter;
        this.stay = false;
    }

    public EndAction(Type type) {
        this.type = type;
        this.counter = 0;
        this.stay = false;
    }

    @Override
    public int hashCode() {
        return 31 * (type.hashCode() + counter) + (stay ? 0 : 1);
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof EndAction && (((EndAction) obj).type == type) && ((EndAction) obj).counter == counter && ((EndAction) obj).stay == stay;
    }

    public static final EndAction ONCE = new EndAction(Type.ONCE);

    public boolean isRepeating() {
        return type == Type.BOUNCE || type == Type.LOOP;
    }

}
