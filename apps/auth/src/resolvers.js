import { PrismaClient } from "@prisma/client";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getUsers: async (_, __, { req }) => {
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      return prisma.user.findMany({
        where: { // of the same company
          companyId: req.companyId,
        },
        include: {
          company: true,
        },
      });
    },
    getUser: async (_, { id }, context) => { 
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      return prisma.user.findUnique({
        where: { id },
        include: { company: true },
      });
    },
    getCompany: async (_, { id }, context) => {
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      return prisma.company.findUnique({
        where: { id },
        include: { users: true },
      });
    },
    getCompanies: async () => { // FALTA PONER MIDDLEWARE O ALGO QUE CHEQUEE SI SOMOS ADMIN
      return prisma.company.findMany({
        include: {
          users: true,
        },
      });
    },

    // Login
    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({
        where: { email: email },
        include: {
          company: true,
        },
      });
      if (!user) {
        throw new Error("User does not exists");
      }
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        throw new Error("Password is incorrect");
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email, companyId: user.company.id },
        "provoletateamo",
        { expiresIn: "1h" }
      );
      return {
        userId: user.id,
        companyId: user.company.id,
        token: token,
        tokenExpiration: 1,
      };
    },
  },

  Mutation: {
    // Create User
    createUser: async (
      _,
      { name, email, last_name, password, company_name }
    ) => {
      //check if email exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("Email address is already in use");
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const company = await prisma.company.create({
        data: { name: company_name },
      });
      return prisma.user.create({
        data: {
          name,
          email,
          last_name,
          password: hashedPassword,
          company: { connect: { id: company.id } },
        },
      });
    },

    // Update a user by Id, name and email
    updateUser: async (_, { name, last_name, email }, context) => {
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      // check if email is already used on another user.
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if(existingUser){
        if (existingUser.id != req.userId) {
          // if its not the same user then its tryng to change to an email already used
          throw new Error("Email address is already in use");
        }
      }
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { name, last_name, email },
        include: { company: true },
      });
      return user;
    },

    updatePassword: async (_, { old_password, password, password_confirmation }, context) => {
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      // check if email is already used on another user.
      let user = await prisma.user.findUnique({ where: { id: req.userId } });
      const isEqual = await bcrypt.compare(old_password, user.password);
      // password check
      if (!isEqual) {
        throw new Error("Password is incorrect");
      }
      // password and new password check
      if(password === password_confirmation){
        // old passowrd different than new one check
        if(old_password === password){
          throw new Error("Cant be the same password");
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        user = await prisma.user.update({
          where: { id: req.userId },
          data: { password: hashedPassword },
          include: { company: true },
        });
        return user;
      }else{
        throw new Error("Password doesnt match");
      }
    },

    // Add user to company
    addUser: async (_, { name, email, last_name }, context) => {
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      const company = await prisma.company.findUnique({
        where: { id: req.companyId },
      });
      if (!company) {
        throw new Error("Company not found");
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("Email address is already in use");
      }
      return prisma.user.create({
        data: {
          name,
          email,
          last_name,
          password: "", // user later receive an email with invitation and setup password link
          company: { connect: { id: company.id } },
        },
      });
    },

    // Delete a user by ID
    // ojo con esto, q pasa si es el ultimo user? para mi que no te puedas eliminar a vos mismo? nose
    deleteUser: async (_, { id }, context) => {
      const { req } = context;
      if(!req.isAuth){
        throw new Error('Unauthenticated!')
      }
      const user = await prisma.user.delete({
        where: { id },
      });
      return user;
    },

    
  },
  /// RELACIONES
  Company: {
    users: async (parent) => {
      return prisma.user.findMany({ where: { companyId: parent.id } });
    },
    forms: async (parent) => {
      return prisma.form.findMany({ where: { companyId: parent.id } });
    },
  },
  User: {
    company: async (parent) => {
      return prisma.company.findUnique({ where: { id: parent.companyId } });
    },
  },
  Form: {
    company: async (parent) => {
      return prisma.company.findUnique({ where: { id: parent.companyId } });
    },
    inputs: async (parent) => {
      return prisma.formInput.findMany({ where: { formId: parent.id } });
    },
  },
  FormInput: {
    form: async (parent) => {
      return prisma.form.findUnique({ where: { id: parent.formId } });
    },
    options: async (parent) => {
      return prisma.inputOption.findMany({ where: { formInputId: parent.id } });
    },
  },
  InputOption: {
    formInput: async (parent) => {
      return prisma.formInput.findUnique({ where: { id: parent.formInputId } });
    },
  },
};
