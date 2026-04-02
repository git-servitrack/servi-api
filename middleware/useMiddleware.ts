export function UseMiddleware(middleware: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const [req, res, next] = args;
      return new Promise((resolve) => {
        let handled = false;

        const done = (err?: any) => {
          if (handled) return;
          handled = true;

          if (err) {
            next(err);
            resolve(undefined);
            return;
          }

          Promise.resolve(originalMethod.apply(this, args)).then(resolve).catch(next);
        };

        middleware(req, res, done);
      });
    };

    return descriptor;
  };
}
