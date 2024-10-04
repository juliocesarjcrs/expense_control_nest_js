// import { Inject, Injectable } from '@nestjs/common';
// import {
//   // registerDecorator,
//   // ValidationOptions,
//   ValidatorConstraint,
//   // ValidatorConstraintInterface,
//   ValidationArguments,
// } from 'class-validator';
// // import { User } from 'src/users/entities/user.entity';
// import { UsersService } from 'src/users/users.service';

// // @ValidatorConstraint({ async: true })
// // @Injectable()
// // export class IsUserAlreadyExistConstraint
// //   implements ValidatorConstraintInterface {
// //   constructor(protected readonly usersService: UsersService) {}
// //   validate(idUser: any, args: ValidationArguments) {
// //     if (!idUser) {
// //       return false;
// //     }
// //     return this.usersService.findOne(idUser).then((user) => {
// //       if (user) return false;
// //       return true;
// //     });
// //   }
// // }

// // export function IsUserAlreadyExist(validationOptions?: ValidationOptions) {
// //   return function (object: number, propertyName: string) {
// //     registerDecorator({
// //       target: object.constructor,
// //       propertyName: propertyName,
// //       options: validationOptions,
// //       constraints: [],
// //       validator: IsUserAlreadyExistConstraint,
// //     });
// //   };
// // }

// // https://github.com/nestjs/nest/issues/528
// //https://stackoverflow.com/questions/60062318/how-to-inject-service-to-validator-constraint-interface-in-nestjs-using-class-va
// @ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
// @Injectable()
// export class IsUserAlreadyExist {
//   constructor(
//     @Inject('UsersService') private readonly userService: UsersService,
//   ) {}

//   async validate(text: string) {
//

//     const user = await this.userService.findOne(text);
//     return !user;
//   }

//   defaultMessage(args: ValidationArguments) {
//     return 'User with this email already exists.';
//   }
// }
/////////////////////////////////////////////////////////////////////////
// import { Injectable } from '@nestjs/common';
// import {
//   registerDecorator,
//   ValidationOptions,
//   ValidatorConstraint,
//   ValidatorConstraintInterface,
//   ValidationArguments,
// } from 'class-validator';
// import { CategoriesService } from 'src/categories/categories.service';
// @Injectable()
// @ValidatorConstraint({ async: true })
// export class IsCategoryExistConstraint implements ValidatorConstraintInterface {
//   validate(idCategory: any, args: ValidationArguments) {
//     return CategoriesService.findOne(idCategory).then((user) => {
//       if (user) return false;
//       return true;
//     });
//   }
// }

// export function IsCategoryAlreadyExist(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [],
//       validator: IsCategoryExistConstraint,
//     });
//   };
// }
